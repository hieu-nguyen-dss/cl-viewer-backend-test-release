import fetch from 'node-fetch';
import qs from 'qs';
import { SiteResponse } from './types/landlog/sites';

const LL_API_URL = process.env.LL_API_URL;
const LL_AUTH_URL = process.env.LL_AUTH_URL;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const ACCESS_TOKEN_URI = `${LL_AUTH_URL}/connect/token`;
const SITES_URI = `${LL_API_URL}/v2/sites`;
const RESOURCE_OWNER_URI = `${LL_API_URL}/v2/resource_owners`;
const CORPORATION_USER_URI = `${LL_API_URL}/v2/corporations/:corporation_id/users/:user_id`;

export const getHeaders = (accessToken: string) => {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
};

export const getUserDetails = (accessToken: string) => {
  const url = `${LL_API_URL}/v2/me`;
  return fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => res.json());
};

export const getResourceOwner = async (accessToken: string, siteId: string) => {
  const sitesResponse = await fetch(`${RESOURCE_OWNER_URI}?groupId=${siteId}`, getHeaders(accessToken));
  const { resource_owners: resourceOwners } = await sitesResponse.json();
  return resourceOwners.map((ro) => ro.id);
};

export const getCorporationUser = async (accessToken: string, corporationId: string, userId: string) => {
  const corporationUserResponse = await fetch(CORPORATION_USER_URI.replace(':corporation_id', corporationId).replace(':user_id', userId), getHeaders(accessToken));

  const user = await corporationUserResponse.json();

  return user;
};

export const getTokenFromAuthorizationCode = (code: string) => {
  const url = `${LL_AUTH_URL}/connect/token`;
  const requestBody = {
    grant_type: 'authorization_code',
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  };
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: qs.stringify(requestBody),
  }).then((res) => res.json());
};

export const getAccessToken = async (refreshToken: string) => {
  const body = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  const results = await fetch(ACCESS_TOKEN_URI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: qs.stringify(body),
  });
  const json = await results.json();

  if (json.error) {
    console.error(json);
    throw new Error('Unable to fetch access token');
    return false;
  } else {
    return json.access_token;
  }
};

export const getSites = async (accessToken: string) => {
  const sitesResponse = await fetch(SITES_URI, getHeaders(accessToken));
  const { sites } = (await sitesResponse.json()) as SiteResponse;
  return sites;
};
