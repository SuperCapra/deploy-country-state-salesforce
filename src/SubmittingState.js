import React, {useState, useEffect, useRef} from 'react';
function SubmittingState() {

    const [valueJSON,setValueJSON] = useState([]);
    const [submittable,setSubmittable] = useState(false);

    const sumittableClasses = submittable ? 'submit-value submit-value-enabled' : 'submit-value submit-value-disabled';


    // const submitValue = async (countryIso, stateIso, stateName) => {
    //     await fetch('http://localhost:3000/add-state', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             countryIso: countryIso,
    //             stateIso: stateIso,
    //             stateName: stateName
    //         })
    //     });
    // }

    const submitValues = async () => {
        if(!submittable) return
        await fetch('http://localhost:3000/add-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(valueJSON)
        });
        // for(let i = 0; i < valueJSON.length; i++) {
        //     const item = valueJSON[i];
        //     console.log('submitValues', item);
        //     await submitValue(item.countryIso, item.stateIso, item.stateName);
        // }
    }

    const setJsonSubmitting = (e) => {
        console.log('setJsonSubmitting', e.target.value);
        let jsonUnparsed = e.target.value;
        let setValue = true
        try {
            console.log('inside try', jsonUnparsed);
            let jsonParsed = JSON.parse(jsonUnparsed);
            console.log('setJsonSubmitting', jsonParsed);
            if(Array.isArray(jsonParsed) && jsonParsed.length > 0) {
                for(let i = 0; i < jsonParsed.length; i++) {
                    const item = jsonParsed[i];
                    if(!item.countryIso || !item.stateIso || !item.stateName) {
                        setValue = false;
                        break;
                    }
                }
            } else {
                setValue = false;
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            setValue = false;
        } finally {
            if(setValue) {
                console.log('set value true');
                setValueJSON(JSON.parse(jsonUnparsed));
                setSubmittable(true);
                // document.getElementById('submitButton').addEventListener('click', submitValues);
            } else {
                console.error('set value false');
                setValueJSON([]);
                setSubmittable(false);
                // document.getElementById('submitButton').removeEventListener('click', submitValues);
            }
        }
    }

    return (<div>
        <input type="text" placeholder="JSON" onChange={setJsonSubmitting} />
        <div id="submitButton" className={sumittableClasses} onClick={submitValues}>SUBMIT</div>
    </div>)
}

export default SubmittingState