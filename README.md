This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Speaker Diarization (Identificação de Falantes)

Para habilitar a identificação automática de quem está falando:

### 1. Criar conta no AssemblyAI
- Acesse [assemblyai.com](https://www.assemblyai.com/)
- Crie uma conta gratuita (100h de transcrição/mês)
- Copie sua API key

### 2. Configurar variável de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
ASSEMBLYAI_API_KEY=sua_api_key_aqui
```

### 3. Configurar no Vercel (produção)
- Vá em Settings > Environment Variables
- Adicione `ASSEMBLYAI_API_KEY` com sua key
- Faça redeploy

Sem a API key, o sistema usa Web Speech API (sem identificação de falantes).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
