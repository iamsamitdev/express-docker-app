import express, { type Express, type Request, type Response } from 'express'

const app: Express = express()

const port: number = 3000

app.get('/', (_: Request, res: Response) => {
  res.json({
    message: 'Hello Express + TypeScirpt!!'
  })
})

app.get('/api/hello', (_: Request, res: Response) => {
  res.json({
    message: 'Hello from Express API!'
  })
})

app.listen(port, () => console.log(`Application is running on port ${port}`))