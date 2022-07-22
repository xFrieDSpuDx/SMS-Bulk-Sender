/*
    As SMS does not necessarily count a single character as one when sending it's
    important to know exactly how many characters a message can contain before
    becoming a multi message.

    Multi messages have a maximum of 153 characters instead of the normal 160.
*/

function calculateTextMessage(characters) {
    if (characters === 0) {
        return 0;
    }
    
    let numberOfMessages = 1;

    if (Number(characters) > 160) {
        numberOfMessages = Number(characters / 153);
    }

    return Math.ceil(numberOfMessages);
}

function calculateSMSCharacterLength(inputText) {
    const singleCharacter = "@£$¥èéùìòÇ\nØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\\\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
    const dualCharacter = "\^{}\[~\]|€";
    let characterCount = 0;

    for (var index = 0; index < inputText.length; index++) {
        if (singleCharacter.includes(inputText[index]) === true) {
            characterCount += 1;
            continue;
        }
        if (dualCharacter.includes(inputText[index]) === true) {
            characterCount += 2;
            continue;
        }

        characterCount += 4;
    }

    return calculateTextMessage(characterCount);
}

/************************************************************************************************************************************************************************/

/*
    File uploader
    delay at the end is to ensure the text box has been populated before it's evaluated.
*/
async function onFilesDropHandler(event) {
    event.stopPropagation();
    event.preventDefault();
    document.getElementById("phoneNumberInput").classList.remove("drag-drop");
    document.getElementById("phoneNumberInput").classList.remove("drag-drop-error");

    const fileType = event.dataTransfer.items[0].type;

    if (fileType !== "text/plain") {
        return;
    }

    const selectedFile = event.dataTransfer.files[0];
    let reader = new FileReader();

    reader.readAsText(selectedFile);
    reader.onload = function () {
        document.getElementById("phoneNumberInput").value = reader.result;
    };

    await delay(200);
    phoneNumberInputChange();
}

/*
    Drag over functionality of the file uploader
*/
function onDragOverHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    const fileType = event.dataTransfer.items[0].type;

    if (fileType === "text/plain") {
        document.getElementById("phoneNumberInput").classList.add("drag-drop");
    } else {
        document.getElementById("phoneNumberInput").classList.add("drag-drop-error");
    }

}

/*
    Drag and drop functionality of the file uploader
*/
function onDragLeaveHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById("phoneNumberInput").classList.remove("drag-drop");
    document.getElementById("phoneNumberInput").classList.remove("drag-drop-error");
}

/************************************************************************************************************************************************************************/

/*
    If possible fix any possible errors in the country code before trying to send
*/
function fixCountryCode(sanitisedNumbers) {
    const twoDigitPrefix = ["00", "10"];
    const threeDigitPrefix = ["001", "002", "005", "007", "008", "009",  "011", "012", "013", "014", "119", "810"];
    const nationalDigitPrefix = ["0", "1", "6", "8"];
    const countryCodeLength = String(internationalCode).length;
    let countryCodeCorrected = [];
    let includesCountryCode = false;
    unableToSanitise = [];

    for (let index = 0; index < sanitisedNumbers.length; index++) {
        if (sanitisedNumbers[index] === "+") {
            includesCountryCode = true;
            continue;
        }
        
        if (includesCountryCode === true) {
            includesCountryCode = false;
            countryCodeCorrected.push("+" + sanitisedNumbers[index]);
            continue;
        }
        
        if (threeDigitPrefix.indexOf(sanitisedNumbers[index].substring(0, 3)) !== -1) {
            sanitisedNumbers[index] = sanitisedNumbers[index].slice(3);
            countryCodeCorrected.push("+" + sanitisedNumbers[index]);
            continue;
        }
        
        if (twoDigitPrefix.indexOf(sanitisedNumbers[index].substring(0, 2)) !== -1) {
            sanitisedNumbers[index] = sanitisedNumbers[index].slice(2);
            countryCodeCorrected.push("+" + sanitisedNumbers[index]);
            continue;
        }
        
        if (nationalDigitPrefix.indexOf(sanitisedNumbers[index].substring(0, 1)) !== -1) {
            sanitisedNumbers[index] = sanitisedNumbers[index].slice(1);
            countryCodeCorrected.push(internationalCode + sanitisedNumbers[index]);
            continue;
        }
        
        unableToSanitise.push(sanitisedNumbers[index]);
    }

    return countryCodeCorrected;
}

/*
    Clean the numbers in the number input box and return an array
    that can be used for sending to the Telnyx API
*/
function cleanNumbersReturnArray(numberInput) {
    if (Array.isArray(numberInput)) {
        numberInput = numberInput.toString();
    }

    let sanitisedNumbers = numberInput.replace(/[^0-9+\n,]/g, "");
    sanitisedNumbers = sanitisedNumbers.split(/(?=\+)(\+)|[ \n\r,]/g);
    sanitisedNumbers = sanitisedNumbers.filter(item => item);
    sanitisedNumbers = fixCountryCode(sanitisedNumbers);

    sanitisedNumbers = sanitisedNumbers.filter(arrayValue => arrayValue !== String(internationalCode));
    sanitisedNumbers = sanitisedNumbers.filter(arrayValue => arrayValue);

    return sanitisedNumbers;
}

/************************************************************************************************************************************************************************/

/*
    Pre-empt possible errors. Check the input numbers for known errors and report
    to the user before they send any messages
*/
function checkForNumberErrors(numbersToSendSMS) {
    // Reset error messages
    document.getElementById("invalidNumbers").classList.add("hide-element");
    document.getElementById("missingCountryCodeErrors").classList.add("hide-element");
    document.getElementById("duplicateNumbers").classList.add("hide-element");
    
    const totalNumbers = numbersToSendSMS.length;
    invalidNumbers = checkNumberLength(numbersToSendSMS);
    const numberOfErrors = invalidNumbers.length;
    const numberOfMissingCountryCodes = unableToSanitise.length;
    
    const totalErrorsFound = (numberOfErrors + numberOfMissingCountryCodes + duplicateNumbersArray.length);
    
    if (totalErrorsFound === 0) {
        document.getElementById("phoneNumberInput").classList.remove("form__section-error");
        document.getElementById("phoneNumberInput").classList.remove("form__section-some-error");
        document.getElementById("totalErrors").innerHTML = "<b>" + totalErrorsFound + "</b> errors found in the input numbers.";
        
        updateNavigationStatus("step2", "numberList", true);
        
        return;
    }

    /*
        Populate messages and update UI to show errors
    */
    if (numberOfErrors !== 0) {
        populateNumberErrors(invalidNumbers, "invalidNumbers");
    }
    
    if (numberOfMissingCountryCodes !== 0) {
        populateNumberErrors(unableToSanitise, "missingCountryCodeErrors");
    }
    
    if (totalErrorsFound === 1) {
        document.getElementById("totalErrors").innerHTML = "<b>" + totalErrorsFound + "</b> error found in the input numbers.";
    } else {
        document.getElementById("totalErrors").innerHTML = "<b>" + totalErrorsFound + "</b> errors found in the input numbers.";
    }
    
    if (totalNumbers - totalErrorsFound !== 0) {
        updateNavigationStatus("step2", "numberList", true);
        
        document.getElementById("phoneNumberInput").classList.add("form__section-some-error");
        document.getElementById("phoneNumberInput").classList.remove("form__section-error");
    }
    
    if (totalNumbers === totalErrorsFound) {
        document.getElementById("phoneNumberInput").classList.add("form__section-error");
        document.getElementById("phoneNumberInput").classList.remove("form__section-some-error");
    }
}

/*
    Check the phone number lengths for possible errors
*/
function checkNumberLength(numbersToSendSMS) {
    let possibleErrors = [];
    const codeLength = internationalCode.length;

    if (codeLength === 0) {
        return possibleErrors;
    }

    for (let index = 0; index < numbersToSendSMS.length; index++) {
        if (numbersToSendSMS[index].length <= 4) {
            possibleErrors.push(numbersToSendSMS[index]);
            continue;
        }
        
        const numberDetails = window.libphonenumber.parsePhoneNumber(numbersToSendSMS[index]);
        const numberValidStatus = numberDetails.isValid();

        if (!numberValidStatus) {
            possibleErrors.push(numbersToSendSMS[index]);
        }
    }

    return possibleErrors;
}

/*
    Find duplicate numbers in the number input.
    Avoid double sending messages and extra costs where not needed
*/
function checkForDuplicateNumbers(numbersToSendSMS) {
    const set = new Set(numbersToSendSMS);
    duplicateNumbersArray = numbersToSendSMS.filter(item => {
        if (set.has(item)) {
            set.delete(item);
        } else {
            return item;
        }
    });
    const totalDuplicatesFound = duplicateNumbersArray.length;

    if (totalDuplicatesFound !== 0) {
        populateNumberErrors(duplicateNumbersArray, "duplicateNumbers");
        document.getElementById("phoneNumberInput").classList.add("form__section-some-error");
        
        if (totalDuplicatesFound === 1) {
            document.getElementById("totalDuplicates").innerHTML = "Sending to <b>" + totalDuplicatesFound + "</b> duplicate number.";
        } else {
            document.getElementById("totalDuplicates").innerHTML = "Sending to <b>" + totalDuplicatesFound + "</b> duplicate numbers.";
        }
        document.getElementById("totalDuplicates").classList.remove("hide-element");
        
    } else {
        document.getElementById("totalDuplicates").classList.add("hide-element");
        document.getElementById("totalDuplicates").innerHTML = "";
    }
}

/*
    Create a CSV file from an array and allow download
*/
function createCSVForDownload(arrayToConvert, anchorElement) {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    for (var selectedNumber in arrayToConvert) {
        csvContent += arrayToConvert[selectedNumber] + "\r\n";
    }
    
    const encodedUri = encodeURI(csvContent);
    let downloadLink = document.getElementById(anchorElement);
    
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", anchorElement + ".csv");
}

/*
Create a CSV file from an array and allow download
*/
function createCSVForSendStatusDownload(arrayToConvert, anchorElement) {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    for (var selected in arrayToConvert) {
        const selectedNumber = arrayToConvert[selected][0];
        const selectedStatus = arrayToConvert[selected][1];
        const selectedMessage = arrayToConvert[selected][2];
        csvContent += selectedNumber + "," + selectedStatus + "," + selectedMessage + "\r\n";
    }
    
    const encodedUri = encodeURI(csvContent);
    let downloadLink = document.getElementById(anchorElement);
    
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", anchorElement + ".csv");
}

/*
    Build an array with success or error values
*/
function createSendCompleteCSVArray (appendToArray, numberArray, sendStatus) {
    const sentMessage = document.getElementById("textMessageInput").value.replace(/\n/g, "\\n");
    
    for (var selectedNumber in numberArray) {
        const valueToAppendToArray = [numberArray[selectedNumber], sendStatus, sentMessage];
        appendToArray.push(valueToAppendToArray);
    }
    
    return appendToArray;
}
