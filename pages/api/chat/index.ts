// pages/api/chat.js

import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import crypto from 'crypto';
import redis from "../../../lib/redis";

const openai = new OpenAI({
  organization: process.env.OPENAI_ORG_ID, // Store sensitive information in environment variables
  apiKey: process.env.OPENAI_API_KEY, // Store API key in environment variables
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const cacheKey = hashPrompt(prompt);
  
  try {
    const cachedResponse = await redis.get(cacheKey);
    //if cached response exists, return it    
    if (cachedResponse) {
      console.log('Returning cached response');
      return res.status(200).json({ response: cachedResponse });
    }
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Change model as per your requirements
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    let responseContent = '';

    for await (const chunk of stream) {
      if (chunk.choices[0].delta.content !== undefined) {
        responseContent += chunk.choices[0].delta.content;
      }
    }
    await redis.set(cacheKey,responseContent, {
      EX: 3600,
    });
    res.status(200).json({ response: responseContent });
  } catch (error) {
    console.error('Error fetching completion:', error);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
}
export function hashPrompt(prompt: string) {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}