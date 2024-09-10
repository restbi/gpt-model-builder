import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const queries = await prisma.restBIQuery.findMany();
      return res.status(200).json(queries);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch queries" });
    }
  } else if (req.method === 'POST') {
    try {
      const { modelId, query } = req.body;
      const newQuery = await prisma.restBIQuery.create({
        data: { modelId, query: JSON.stringify(query) },
      });
      return res.status(201).json(newQuery);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create query" });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
