import { useEffect, useState, type JSX } from "react";
import { gadgetConfigurations, wikiConfigurations } from "../../gadget-conf.ts";
import type { GadgetId, WikiId } from "./types";
import {BACKEND_URL} from "./consts.ts";

export function Result() {
    const urlParams = new URLSearchParams(location.search);
    const state = urlParams.get('state')!
    const code = urlParams.get('code')!

    const [gadgetId, wikiId] = state.split('@') as [GadgetId, WikiId];

    const gadgetInfo = gadgetConfigurations[gadgetId]
    const wikiInfo = wikiConfigurations[wikiId]

    // States
    const [shellUpdates, setShellUpdates] = useState<JSX.Element[]>([])
    const [status, setStatus] = useState(<></>)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        console.log('in useEffect')
        streamDeploymentUpdates(code, gadgetId, wikiId, setShellUpdates, setStatus, setIsLoading)
    }, [])
    
    return (
        <>
            <h2>Deploying {gadgetInfo.name} to {wikiInfo.name}</h2>
            <div>
                {shellUpdates}
            </div>
            <div>
                {status}
            </div>
            <br/>
            {isLoading && <img src="/images/loading.gif" height="40" width="40" alt="loading" />}
        </>
    )
}

function Error({ msg }: {msg: string}) {
    return <span style={{color: 'red', fontWeight: 'bold', fontSize: 'larger'}}>{msg}</span>
}

function streamDeploymentUpdates(
    code: string, 
    gadgetId: GadgetId, 
    wikiId: WikiId, 
    setShellUpdates: React.Dispatch<React.SetStateAction<JSX.Element[]>>, 
    setStatus: React.Dispatch<React.SetStateAction<JSX.Element>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
    const source = new EventSource(`${BACKEND_URL}/stream?code=${code}&gadget=${gadgetId}&wiki=${wikiId}`);

    source.onopen = function () {
        console.log('Connected to stream');
    }
    source.onmessage = function (msg) {
        const text = atob(msg.data);
        const returnText = <div style={{fontWeight: 'bold', fontSize: 'larger', marginTop: '30px'}}>
            <a href="/">
                ← Return to Wikimedia Gadget Deployer
            </a>
        </div>

        if (text === 'end:success') {
            setStatus(<>
                <span style={{fontWeight: 'bold', fontSize: 'larger', color: 'green'}}>
                    {gadgetId} deployment completed successfully :)
                </span>
                {returnText}
            </>)
            finish();
        } else if (text === 'end:failure') {
            setStatus(<>
                <Error msg="Deployment unsuccessful :("></Error><br/>
                <span>Please see the error message above.</span>
                {returnText}
            </>)
			finish();
        } else {
            setShellUpdates(updates => [
                ...updates,
                // This becomes an XSS vector only if the deploy script prints malicious JS
                text === '' ? <br key={updates.length}/> : <div dangerouslySetInnerHTML={{__html: text}} key={updates.length} />
            ]);
        }
    }
    source.onerror = function (err) {
        finish();
        setStatus(<>
            <Error msg="Something bad happened :("></Error><br/>
            <span>Please check the wiki to see if deployment was successful or try again.</span>
        </>)
        console.error(err);
    }

    function finish() {
        setIsLoading(false);
        source.close();
    }

}
