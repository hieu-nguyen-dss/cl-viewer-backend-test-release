import express from 'express';
import {
  createSiteMachinesPeriodForCorporation,
  deleteSiteMachineBySk,
  getMachinesForCorporation,
  getMachinesLinksForSiteMachine,
  getSiteMachineBySk,
  getSiteMachinesForCorporation,
} from '../../../clviewercommons/opt/machines';
import { isDate } from '../../../clviewercommons/opt/utils';
const adminRoutes = express.Router();

const isMachinePeriodDataInvalid = (req: express.Request, res: express.Response, siteId: string, machineId: string, startDateJst: string, endDateJst: string) => {
  if (!siteId) return res.status(400).json({ error: 'siteId is required' });
  if (!machineId) return res.status(400).json({ error: 'machineId is required' });
  if (!startDateJst) return res.status(400).json({ error: 'startDate is required' });
  if (!endDateJst) return res.status(400).json({ error: 'endDate is required' });
  if (!isDate(startDateJst)) return res.status(400).json({ error: 'Start Date in invalid.' });
  if (!isDate(endDateJst)) return res.status(400).json({ error: 'End Date in invalid.' });
  if (new Date(startDateJst).getTime() > new Date(endDateJst).getTime()) return res.status(400).json({ error: 'End Date should be greater than or equal to Start Date.' });
  return false;
};

adminRoutes.get('/machines', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const { corporationId } = user;
  const vehicles = await getMachinesForCorporation(corporationId);

  const responseObject = [];

  vehicles.forEach(({ vehicleId, machineId, earliestSensingUnixtime, latestSensingUnixtime }) => {
    responseObject.push({
      vehicleId,
      machineId,
      earliestSensingUnixtime,
      latestSensingUnixtime,
    });
  });

  res.status(200).json(responseObject);
});

adminRoutes.get('/links', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const { corporationId } = user;
  const siteMachinePeriodPromise = getSiteMachinesForCorporation(corporationId);

  const siteMachinePeriodData = await siteMachinePeriodPromise;

  res.status(200).json(
    siteMachinePeriodData.map(({ sk, siteId, startDateJst, endDateJst, machineId, machineName, machineType }) => {
      return {
        id: sk,
        siteId,
        startDateJst,
        endDateJst,
        machineId,
        machineName,
        machineType,
      };
    })
  );
});

adminRoutes.post('/links', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const { corporationId } = user;

  const { siteId, startDateJst, endDateJst, machineId, machineName, machineType } = req.body;
  if (isMachinePeriodDataInvalid(req, res, siteId, machineId, startDateJst, endDateJst)) {
    return;
  }

  const existingLinks = await getMachinesLinksForSiteMachine(corporationId, siteId, machineId, startDateJst, endDateJst);
  if (existingLinks?.length) {
    return res.status(400).json({ error: `Site link already exists for this period` });
  }

  await createSiteMachinesPeriodForCorporation(corporationId, siteId, machineId, startDateJst, endDateJst, machineName, machineType);
  res.status(200).json({ siteId, machineId, startDateJst, endDateJst, machineName, machineType });
});

adminRoutes.patch('/links/:linkId', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const { corporationId } = user;
  const { linkId } = req.params;

  const { siteId, machineId, startDateJst, endDateJst, machineName, machineType } = req.body;
  if (isMachinePeriodDataInvalid(req, res, siteId, machineId, startDateJst, endDateJst)) {
    return;
  }

  const siteMachine = await getSiteMachineBySk(corporationId, linkId);
  if (!siteMachine) {
    return res.status(404).json({ error: 'Record Not Found' });
  }
  await deleteSiteMachineBySk(corporationId, linkId);
  await createSiteMachinesPeriodForCorporation(corporationId, siteId, machineId, startDateJst, endDateJst, machineName, machineType);

  res.status(200).json({ corporationId, siteId, machineId, startDateJst, endDateJst, machineName, machineType });
});

adminRoutes.delete('/links/:linkId', async (req: express.Request, res: express.Response) => {
  const { user } = req;
  const { corporationId } = user;
  const { linkId } = req.params;
  const siteMachine = await getSiteMachineBySk(corporationId, linkId);
  if (!siteMachine) {
    return res.status(404).json({ error: 'Record Not Found' });
  }
  await deleteSiteMachineBySk(corporationId, linkId);
  res.sendStatus(200);
});

export default adminRoutes;
