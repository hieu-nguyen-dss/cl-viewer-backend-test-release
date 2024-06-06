import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import { getCorporationUser, getTokenFromAuthorizationCode, getUserDetails } from '../../../../clviewercommons/opt/landlog.api';
import { createNewUser, getUserById, setUserDetails } from '../../../../clviewercommons/opt/users';

const loginRoute = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const issueJwtToken = (user) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7 days' });
};

loginRoute.get('/', async (req: express.Request, res: express.Response) => {
  // get code from query params.
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Code was not provided!');
  }

  //  make an API call to landlog api to get access-token and refresh-token.
  const apiResponse = await getTokenFromAuthorizationCode(code as string);

  if (apiResponse.error) {
    throw Error(apiResponse.error);
  }
  const { access_token: accessToken, refresh_token: refreshToken } = apiResponse;

  // get user details from landlog api.
  const userDetails = await getUserDetails(accessToken);
  const {
    id: userId,
    name: userName,
    email,
    corporation: { id: corporationId, name: corporationName },
  } = userDetails;
  // check if user exists in db or not.
  const user = await getUserById(userId);
  const corporationUser = await getCorporationUser(accessToken, corporationId, userId);

  const admin = corporationUser.role === 'admin' || corporationUser.role === 'super_admin';
  const jwtToken = issueJwtToken({ userId, userName, admin });
  if (user) {
    await setUserDetails(userId, { corporationId, corporationName, refreshToken });
  } else {
    await createNewUser(userId, userName, email, corporationId, corporationName, refreshToken);
  }
  res.json({ user: { userName, email, userId, admin, corporationName }, jwtToken });
});
export default loginRoute;
