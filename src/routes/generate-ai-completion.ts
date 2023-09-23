import { FastifyInstance } from "fastify";
import z from 'zod'
import { streamToResponse, OpenAIStream } from 'ai'
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai";

export async function generateAICompletionRoute(app: FastifyInstance) {
    app.post('/ai/complete', async (request, response) => {
        
        const bodySchema = z.object({
            videoId: z.string().uuid(),
            prompt: z.string(),
            temperature: z.number().min(0).max(1).default(0.5)
        })


        const { videoId, prompt, temperature } = bodySchema.parse(request.body)

        const video = await prisma.video.findUniqueOrThrow({
            where: {
             id: videoId    
            }
        })

        if(!video.transcription) {
            return response.status(400).send({ error: 'Video transcription was not generated yet.' })
        }

        const promptMessage = prompt.replace('{transcription}', video.transcription) //adicionar a transcrição

        const responseOpenAiCreateText = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo-16k', //versão free mas aceita menos tokens (menos caracteres de env-io e retorno)
            temperature,
            messages: [
                { role: 'user', content: promptMessage}
            ],
            stream: true, //gerar uma linha de cada vez
        })

        //para gerar renpose linha de cada vez pra nao gerar tudo de uma vez

        const stream = OpenAIStream(responseOpenAiCreateText)

        streamToResponse(stream, response.raw, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        
            }
        })
        //return responseOpenAiCreateText

    })
}