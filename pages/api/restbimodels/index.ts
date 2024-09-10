import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const models = await prisma.restBIModel.findMany();
      return res.status(200).json(models);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch models" });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, model } = req.body;
      const newModel = await prisma.restBIModel.create({
        data: { name, model: JSON.stringify(model) },
      });
      return res.status(201).json(newModel);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create model" });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
