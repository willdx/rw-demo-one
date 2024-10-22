import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const file = files.image as File;
    if (!file || !file[0]) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageFile = file[0];

    try {
      const imageBuffer = fs.readFileSync(imageFile.filepath);
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        'https://api.imgur.com/3/image',
        {
          image: base64Image,
          type: 'base64',
        },
        {
          headers: {
            Authorization: 'Client-ID 9ac5f0dc6f3d272',
          },
        }
      );

      if (response.data.success) {
        res.status(200).json({
          success: 1,
          data: {
            link: response.data.data.link,
          },
        });
      } else {
        res.status(500).json({ error: 'Failed to upload image to Imgur' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Error uploading image' });
    } finally {
      // 清理临时文件
      try {
        if (imageFile.filepath) {
          fs.unlinkSync(imageFile.filepath);
        }
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  });
}
