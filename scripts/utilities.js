/*
    As SMS does not necessarily count a single character as one when sending it's
    important to know exactly how many characters a message can contain before
    becoming a multi message.

    Multi messages have a maximum of 153 characters instead of the normal 160.
*/

function calculateTextMessage(characters) {
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

    let files = event.dataTransfer.files;

    for (let index = 0, selectedFile; selectedFile = files[index]; index++) {
        let reader = new FileReader();

        reader.readAsText(selectedFile);
        reader.onload = function () {
            document.getElementById("phoneNumberInput").value = reader.result;
        };
    }

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
    const countryCodeLength = String(internationalCode).length;
    let countryCodeCorrected = [];

    for (let index = 0; index < sanitisedNumbers.length; index++) {
        if (sanitisedNumbers[index].substring(0, 1) == 0) {
            sanitisedNumbers[index] = sanitisedNumbers[index].slice(1);
        }

        if (sanitisedNumbers[index].substring(0, countryCodeLength - 1) !== String(internationalCode.substring(1))) {
            countryCodeCorrected.push(internationalCode + sanitisedNumbers[index]);
        } else {
            countryCodeCorrected.push("+" + sanitisedNumbers[index]);
        }
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
    sanitisedNumbers = sanitisedNumbers.split(/[ +\n,]+/);
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
function checkForNumberErrors(numberArray) {
    const possibleErrorNumbers = checkNumberLength(numberArray);
    const numberOfErrors = possibleErrorNumbers.length;

    if (numberOfErrors !== 0) {
        document.getElementById("sendErrors").innerHTML = "<b>" + numberOfErrors + " number(s) with errors</b>";
        populateFinalErrorMessage(possibleErrorNumbers, "sendErrors");
    }
}

/*
    Check the phone number lengths for possible errors
*/
function checkNumberLength(numberArray) {
    let possibleErrors = [];
    const codeLength = internationalCode.length;

    if (codeLength === 0) {
        document.getElementById("sendErrors").innerHTML = "Error: Populate the Telnyx Mobile Number to allow error checking on the phone number list.";
        return possibleErrors;
    }

    for (let index = 0; index < numberArray.length; index++) {
        if (numberArray[index].length < 10 + codeLength || numberArray[index].length > 10 + codeLength) {
            possibleErrors.push(numberArray[index]);
        }
    }

    return possibleErrors;
}

/*
    Find duplicate numbers in the number input.
    Avoid double sending messages and extra costs where not needed
*/
function checkForDuplicateNumbers(numberArray) {
    const set = new Set(numberArray);
    const duplicateNumbersArray = numberArray.filter(item => {
        if (set.has(item)) {
            set.delete(item);
        } else {
            return item;
        }
    });
    const totalDuplicatesFound = duplicateNumbersArray.length;

    if (totalDuplicatesFound !== 0) {
        document.getElementById("duplicateNumbers").innerHTML = "<b>" + totalDuplicatesFound + " duplicate number(s) found</b>";
        populateFinalErrorMessage(duplicateNumbersArray, "duplicateNumbers");
    }
}

/************************************************************************************************************************************************************************/

/*
    Check against cookies to see if sending was halted halfway through and offer to send the remaining
*/
function checkIfNumbersAreSentAlready(cleanedInputNumbers) {
    return cleanedInputNumbers.filter(x => partialSendArray.indexOf(x) === -1);
}

/************************************************************************************************************************************************************************/

/*
    Toggle disable form input
*/
function toggleDisabled() {
    // Select the billing text fields
    var billingItems = document.querySelectorAll("#smsInputForm input[type='text'], textarea");

    // Toggle the billing text fields
    for (var i = 0; i < billingItems.length; i++) {
        billingItems[i].disabled = !billingItems[i].disabled;
    }
}
