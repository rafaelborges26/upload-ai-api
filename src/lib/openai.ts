import 'dotenv/config'

//para conseguir ler variaveis no .env declaradas sem precisar colocar o PUBLIC_NODEENV ANTES DO NOME DA VARIAVEL...

import { OpenAI } from 'openai'

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
})