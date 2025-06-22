import { createRoot } from 'react-dom/client'
import { Landing } from "./Landing.tsx";
import { Result } from "./Result.tsx";

const urlParams = new URLSearchParams(location.search)
const isResult = urlParams.has('code') && urlParams.has('state')

createRoot(document.getElementById('root')!).render(
    isResult ? <Result /> : <Landing />
)
