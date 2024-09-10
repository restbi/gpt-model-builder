import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const model = await prisma.restBIModel.findUnique({
        where: { id: id as string },
      });
      if (model) {
        return res.status(200).json(model);
      } else {
        return res.status(404).json({ message: 'Model not found' });
      }
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch model" });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, model } = req.body;
      const updatedModel = await prisma.restBIModel.update({
        where: { id: id as string },
        data: { name, model: JSON.stringify(model) },
      });
      return res.status(200).json(updatedModel);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update model" });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.restBIModel.delete({
        where: { id: id as string },
      });
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete model" });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
