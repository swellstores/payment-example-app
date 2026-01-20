export async function getAppSettings(req: SwellRequest, configId = "card") {
  return req.swell.settings(`${req.appId}/${configId}`);
}
