import { getHealthAssistantResponse } from "../services/healthAssistant.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const askHealthAssistant = asyncHandler(async (req, res) => {
  const { symptoms, latitude, longitude } = req.body;

  const result = await getHealthAssistantResponse({
    symptoms,
    profile: req.user,
    latitude,
    longitude
  });

  res.status(200).json(result);
});
