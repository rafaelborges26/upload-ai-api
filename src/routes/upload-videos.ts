import { FastifyInstance } from "fastify";
import { fastifyMultipart } from '@fastify/multipart'
import path from "node:path";
import { randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream'
import fs from 'fs'
import { promisify } from "node:util";

import { prisma } from "../lib/prisma";

const pump = promisify(pipeline) //transforma funcoes mais antigas do node pra usar async await



export async function uploadVideoRoute(app: FastifyInstance) {

    //definir limite de tamanho do arquivo
    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1_048_576 * 25 //25mb
        }
    })


    app.post('/videos', async (request, response) => {

        const data = await request.file()

        if(!data) {
            return response.status(400).send({error: 'Missing file input'})
        }

        const extensions = path.extname(data.filename)

        if(extensions !== '.mp3') {
            return response.status(400).send({error: 'Invalid input type, please upload a MP3'})
        }

        //alterar nome do arquivo
        const fileBaseName = path.basename(data.fieldname, extensions) //nome do arquivo sem a extensao
        const fileUploadName = `${fileBaseName}-${randomUUID()}${extensions}` //nome unico

        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

        //recebendo os dados e depois escrevo aos poucos conforme vai chegando e salva no destination
        await pump(data.file, fs.createWriteStream(uploadDestination))

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDestination
            }
        })

        return {
            video
        }
    })
}