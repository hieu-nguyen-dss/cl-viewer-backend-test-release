import { format } from 'date-fns';
import express from 'express';
import { getAccessToken, getSites } from '../../../clviewercommons/opt/landlog.api';
import {
  countMachineBehaviorBetweenTimes, countMachineSensingBetweenTimes, createCorporationSite,
  getAlertsForCorporation,
  getAlertsForMachine, getCorporationMachine,
  getCorporationSite,
  getMachine,
  getMachinesForCorporation,
  getMachinesLinksForSite,
  getSensingForMachine,
  getSiteMachineBySk, getSitesDataForCorporation,
  updateCorporationSite,
  updateSiteMachineBySk
} from '../../../clviewercommons/opt/machines';
import { behaiviors } from '../../../clviewercommons/opt/types/clviewer/behaivior';
import { MachineActivities } from '../../../clviewercommons/opt/types/clviewer/machineActivity';
import { isDate } from '../../../clviewercommons/opt/utils';
const userRoutes = express.Router();

function isDateInvalid(req: express.Request, res: express.Response, siteId: string, startDateJst: string, endDateJst: string) {
  if (!siteId) return res.status(400).json({ error: 'siteId is required' });
  if (!startDateJst) return res.status(400).json({ error: 'startDate is required' });
  if (!endDateJst) return res.status(400).json({ error: 'endDate is required' });
  if (!isDate(startDateJst)) return res.status(400).json({ error: 'Start Date in invalid.' });
  if (!isDate(endDateJst)) return res.status(400).json({ error: 'End Date in invalid.' });
  if (new Date(startDateJst).getTime() > new Date(endDateJst).getTime()) return res.status(400).json({ error: 'End Date should be greater than or equal to Start Date.' });
  return false;
}

function calculateTotalActivitySeconds(activities: MachineActivities): number {
  return (
    activities.map((activity) => {
      return activity.estimatedTotalSeconds
    }).reduce((total, seconds) => {
      return total + seconds
    }, 0)
  );
}

/**
 * Get list of alerts for a user/corporation
 */
userRoutes.get('/alerts', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const alerts = await getAlertsForCorporation(user.corporationId);
  const machines = await getMachinesForCorporation(user.corporationId);
  res.status(200).json({
    corporationId: user.corporationId,
    alerts: alerts.map((alert) => {
      const machine = machines.find((m) => m.machineId === alert.machineId);
      return {
        unixtime: alert.unixtime,
        alertType: alert.alertType,
        alertId: alert.alertId,
        machine: {
          id: machine?.machineId ?? null,
          colorCode: machine?.machineColorCode ?? null,
          name: machine?.machineName ?? null,
          type: machine?.machineType ?? null,
          vehicleId: machine?.vehicleId ?? null,
        },
      }
    })
  });
});

/**
 * Get list of sites for the loggedIn user
 */
userRoutes.get('/sites', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const { refreshToken } = user;
  const accessToken = await getAccessToken(refreshToken);
  const sites = await getSites(accessToken);

  // Getting site details (for now business time as required in settings)
  const corporationSites = await getSitesDataForCorporation(user.corporationId);

  res.status(200).json(
    sites.map((site) => {
      const corporationSite = corporationSites.find((corpSite) => corpSite.siteId === site.id);

      return {
        id: site.id,
        name: site.name,
        coordinate: site.coordinate,
        businessHours: {
          start: corporationSite?.startTimeJst ?? null,
          end: corporationSite?.endTimeJst ?? null,
        },
      };
    })
  );
});

/**
 * Get sensing data for a site specified by siteId
 * Data can be filtered by start and end date
 */
userRoutes.get('/sites/:siteId/sensing', async (req: express.Request, res: express.Response) => {
  const { startDate, endDate } = req.query;
  const { corporationId } = req.user;
  const { siteId } = req.params;

  if (isDateInvalid(req, res, siteId, startDate as string, endDate as string)) return;

  // Get list of all machines from site-machine link
  const siteMachine = await getMachinesLinksForSite(corporationId, siteId, startDate as string, endDate as string);
  // Getting site details for the corporation
  const siteCorp = await getCorporationSite(corporationId, siteId);
  const startTimestamp = Date.parse(`${startDate as string}T00:00:00+09:00`) / 1000
  const endTimestamp = Date.parse(`${endDate as string}T23:59:59+09:00`) / 1000
  console.log(`startDate: ${startDate}, endDate: ${endDate}, startTimestamp: ${startTimestamp}, endTimestamp: ${endTimestamp}`)

  const machinesWithDetails = await Promise.all(
    siteMachine.map(async (machine) => {
      const [machineDetails, corporationMachine] = await Promise.all([
        // Get the latest sensing for the machine within the time period specified
        getSensingForMachine(machine.machineId, startTimestamp, endTimestamp),
        // Getting basic details of the machine
        getCorporationMachine(corporationId, machine.machineId),
      ]);
      // Sorting the sensing data in order so that oldest is seen first
      const sortedSensingData = [...(machineDetails ?? [])]
        .filter((_e, i) => { return i % 5 === 0 })
        .sort((a, b) => a.unixtime - b.unixtime);
      // getting the latest latitude and longitude of the machine
      const latitude = sortedSensingData.length > 0 ? [...sortedSensingData].reverse()[0].latitude : null;
      const longitude = sortedSensingData.length > 0 ? [...sortedSensingData].reverse()[0].longitude : null;

      return {
        linkId: machine.sk,
        siteId: machine.siteId,
        corporationId: machine.corporationId,
        machineId: machine.machineId,
        vehicleId: corporationMachine?.vehicleId ?? null,
        machineColorCode: machine.machineColorCode ?? null,
        machineName: machine.machineName ?? null,
        machineType: machine.machineType ?? null,
        latitude,
        longitude,
        site: {
          startTimeJst: siteCorp?.startTimeJst ?? null,
          endTimeJst: siteCorp?.endTimeJst ?? null,
          startDateJst: machine?.startDateJst ?? null,
          endDateJst: machine?.endDateJst ?? null,
          earliestSensingUnixtime: corporationMachine?.earliestSensingUnixtime ?? null,
          latestSensingUnixtime: corporationMachine?.latestSensingUnixtime ?? null,
        },
        sensingData: sortedSensingData
      };
    })
  );

  return res.status(200).json(machinesWithDetails.filter((machine) => machine !== null));
});

/**
 * Reset the color of the specified machine list to default color
 * Takes array of string as
 */
userRoutes.post('/machines/reset-colors', async (req: express.Request, res: express.Response) => {
  const { corporationId } = req.user;

  const { list } = req.body;
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Machine list must be an array!' });

  const responseObj = [];
  await Promise.all(
    list.map(async (linkId: string) => {
      const machine = await getSiteMachineBySk(corporationId, linkId);
      if (!machine) return null;

      responseObj.push({
        machineId: machine.machineId,
        name: machine.machineName,
        type: machine.machineType,
        color: '#E4E7EC',
      });
      await updateSiteMachineBySk(corporationId, machine.sk, {
        name: machine.machineName,
        type: machine.machineType,
        color: '#E4E7EC',
      });
    })
  );

  return res.status(200).json({ message: 'Successfully reset the color of specified machines!', list: responseObj });
});

/**
 * Update machine details for a machine specified by linkId
 * Only name, color and machine type can be updated
 */
userRoutes.patch('/machines', async (req: express.Request, res: express.Response) => {
  const { corporationId } = req.user;
  const { linkId, name, color, type } = req.body;

  const siteMachine = await getSiteMachineBySk(corporationId, linkId);
  if (!siteMachine) {
    return res.status(404).json({ error: 'Record not found!' });
  }

  await updateSiteMachineBySk(corporationId, linkId, {
    name,
    type,
    color,
  });

  return res.status(200).json({ name, color, type });
});

/**
 * Get the alerts for a specific machine specified by MachineID
 * Data can be filtered by start and end date
 */
userRoutes.get('/machines/:machineId/alerts', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const machineId = req.params.machineId
  const machine = await getMachine(user.corporationId, machineId)
  const alerts = await getAlertsForMachine(machineId);
  res.status(200).json({
    machineId: machineId,
    alerts: alerts.map((alert) => {
      return {
        unixtime: alert.unixtime,
        alertType: alert.alertType,
        alertId: alert.alertId,
        machine: {
          colorCode: machine?.machineColorCode ?? null,
          name: machine?.machineName ?? null,
          type: machine?.machineType ?? null,
          vehicleId: machine?.vehicleId ?? null,
        },
      }
    })
  });
});

userRoutes.get('/me', async (req: express.Request, res: express.Response) => {
  const { corporationId, userId, userName, email, corporationName } = req.user;

  return res.status(200).json({ corporationId, userId, userName, email, corporationName });
});

userRoutes.get('/machines/:machineId/activities', async (req: express.Request, res: express.Response) => {
  const { machineId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date (JST) is required' });
  const targetDate = new Date(date as string);
  const targetDateStartTimestamp = Math.floor(new Date(date as string).setHours(0, 0, 0, 0) / 1000);
  const targetDateEndTimestamp = Math.floor(new Date(date as string).setHours(23, 59, 59, 0) / 1000);
  const targetDateActivities: MachineActivities = await Promise.all(behaiviors.map(async (behaivior) => {
    return {
      estimatedBehaviorId: behaivior.id.toString(),
      estimatedBehaviorType: behaivior.type,
      estimatedTotalSeconds: await countMachineBehaviorBetweenTimes(machineId, behaivior.id, targetDateStartTimestamp, targetDateEndTimestamp),
    }
  }));
  const targettDateTotalActivitiesSeconds = calculateTotalActivitySeconds(targetDateActivities);
  const previousDate = new Date(targetDate.setDate(targetDate.getDate() - 1));
  const previousDateStr = format(previousDate, 'yyyy-MM-dd');
  const previousDateStartTimestamp = Math.floor(new Date(previousDateStr as string).setHours(0, 0, 0, 0) / 1000);
  const previousDateEndTimestamp = Math.floor(new Date(previousDateStr as string).setHours(23, 59, 59, 0) / 1000);
  const previousDateTotalActivitiesSeconds = await Promise.resolve(countMachineSensingBetweenTimes(machineId, previousDateStartTimestamp, previousDateEndTimestamp));
  const rateVsPreviousDate = (previousDateTotalActivitiesSeconds === 0) ? false : (targettDateTotalActivitiesSeconds - previousDateTotalActivitiesSeconds) / previousDateTotalActivitiesSeconds
  return res.status(200).json({
    activities: targetDateActivities,
    totalActivitySeconds: {
      targetDate: targettDateTotalActivitiesSeconds,
      previousDate: previousDateTotalActivitiesSeconds,
    },
    rateVsPreviousDate: rateVsPreviousDate,
  });
});

userRoutes.get('/machines/:machineId/sensing', async (req: express.Request, res: express.Response) => {
  const { machineId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date (JST) is required' });
  const targetDate = new Date(date as string);
  const startTimestamp = Math.floor(new Date(targetDate).setHours(0, 0, 0, 0) / 1000);
  const endTimestamp = Math.floor(new Date(targetDate).setHours(23, 59, 59, 0) / 1000);
  const sensingData = await Promise.resolve(getSensingForMachine(machineId, startTimestamp, endTimestamp));
  return res.status(200).json({
    machineId: machineId,
    dateJst: date,
    unixtime: {
      start: startTimestamp,
      end: endTimestamp
    },
    sensingData: sensingData.map( d => {
      return {
        ut: Number(d.unixtime),
        lat: parseFloat(d.latitude).toFixed(7),
        lon: parseFloat(d.longitude).toFixed(7),
        bId: Number(d.estimatedBehaviorId)
      }
  })
  });
});

export default userRoutes;
