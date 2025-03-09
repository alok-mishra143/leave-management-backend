import express from 'express'
import router from './src/routes';
const app = express()
const PORT =process.env.PORT || 9000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router)



app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`)
})