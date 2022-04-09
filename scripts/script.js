/*
    Global variables
*/
let successArray = []; // An array of numbers that successfully received the message
let sendCost = 0; // Cumulative cost of sent messages
let currencyCode = ""; // Currency code for the country of the Telnyx API account
let emergencyStop = false; // Boolean - If there is an error stop sending further messages
let sendComplete = true; // Boolean - True when sending to avoid double sends
let accountBalance = 0; // Current Telnyx account balance
let successTotal = 0; // Counter for successfully sent messages
let errorTotal = 0; // Counter for failed messages
let partialSendArray = []; // If the browser crashed while sending the cookie will repopulate this array
let internationalCode = ""; // The international code taken from the send from number
const apiURL = { // API details
    balance: "https://api.telnyx.com/v2/balance",
    message: "https://api.telnyx.com/v2/messages"
};

/*
    Set to enable async delay
*/
const delay = async (ms = 1000) =>
    new Promise(resolve => setTimeout(resolve, ms));

/*
    Listeners for form input
*/
document.getElementById("textMessageInput").onchange = function () {
    let textMessageValue = this.value;
    textMessageInputChange(textMessageValue);
};

document.getElementById("textMessageInput").onkeyup = function () {
    let textMessageValue = this.value;
    textMessageInputChange(textMessageValue);
};

document.getElementById("phoneNumberInput").onchange = function () {
    phoneNumberInputChange();
};

document.getElementById("phoneNumberInput").onkeyup = function () {
    phoneNumberInputChange();
};

document.getElementById("telnyxSendFrom").onchange = function () {
    telnyxSendFromChange(this.value);
};

document.getElementById("telnyxSendFrom").onkeyup = function () {
    telnyxSendFromChange(this.value);
};

document.getElementById("apiKey").onchange = function () {
    getAccountInfo();
};

document.getElementById("apiKey").onkeyup = function () {
    getAccountInfo();
};

/*
    Functions called from listeners
*/
function textMessageInputChange(textMessageValue) {
    document.getElementById("characterCount").innerHTML = "Characters: " + textMessageValue.length;
    document.getElementById("smsCount").innerHTML = "SMS Messages: " + calculateSMSCharacterLength(textMessageValue);
}

function phoneNumberInputChange() {
    startPhoneNumberCheck();
}

function telnyxSendFromChange(sendFromNumber) {
    document.getElementById("sendErrors").innerHTML = "";
    internationalCode = sendFromNumber.slice(0, -10);
}

/*
    This function toggles the visibility of div elements based on a checkbox value
*/
function toggleAlphanumericSMS() {
    const alphanumbericCheck = document.getElementById("alphanumericCheck");

    if (alphanumbericCheck.checked) {
        const alphanumbericInput = document.getElementById("alphanumericInput");

        alphanumbericInput.style.display = "block";
    } else {
        const alphanumbericInput = document.getElementById("alphanumericInput");

        alphanumbericInput.style.display = "none";
    }
}

/*
    The function called to send SMS messages
    Puts together the needed details and selects the send method. async or sync.
*/
function sendSMS() {
    if (sendComplete === false) {
        document.getElementById("sendInProgress").innerHTML = "Send in progress please wait...";
        return;
    }

    resetVariables();
    const cleanedInputNumbers = cleanNumbersReturnArray(document.getElementById("phoneNumberInput").value);
    const numbersToSendTo = checkIfNumbersAreSentAlready(cleanedInputNumbers);
    const postDetails = {
        smsMessage: document.getElementById("textMessageInput").value,
        apiKey: document.getElementById("apiKey").value,
        telnyxNumber: document.getElementById("telnyxSendFrom").value,
        alphaNumbericName: document.getElementById("telnyxAlphanumericName").value,
        messagingProfile: document.getElementById("telnyxMessagingProfile").value,
        numberArray: numbersToSendTo,
    };
    const numberArrayLength = postDetails.numberArray.length;

    if (numberArrayLength === 0) {
        document.getElementById("sendErrors").innerHTML = "Error: Please enter at least one phone number.";
        sendComplete = true;
        return;
    }

    toggleDisabled();
    sendSMSAsync(postDetails, numberArrayLength, 0);
}

/*
    Resent all the variables so it's a clean send
*/
function resetVariables() {
    sendComplete = false;
    emergencyStop = false;
    sendCost = 0;
    errorTotal = 0;
    successTotal = 0;
    successArray = [];
    document.getElementById("sendErrors").innerHTML = "";
    document.getElementById("sentMessages").innerHTML = "";
}

/*
    Check the phone numbers entered
*/
function startPhoneNumberCheck() {
    document.getElementById("sendErrors").innerHTML = "";
    document.getElementById("duplicateNumbers").innerHTML = "";
    document.getElementById("sentMessages").innerHTML = "";
    document.getElementById("totalNumbers").innerHTML = "";

    if (document.getElementById("phoneNumberInput").value == "") {
        return;
    }

    const numberArray = cleanNumbersReturnArray(document.getElementById("phoneNumberInput").value);
    const totalNumbers = numberArray.length;

    if (totalNumbers === 0) {
        return;
    }

    document.getElementById("totalNumbers").innerHTML = "Send SMS to " + totalNumbers + " numbers.";
    checkForNumberErrors(numberArray);
    checkForDuplicateNumbers(numberArray);
}

/*
    Handle successfully sent messages
*/
function sendSuccess(response) {
    const sanitisedResponse = JSON.parse(response);
    const successNumber = sanitisedResponse.data.to[0].phone_number;

    if (sanitisedResponse.data.cost.amount === null) {
        return;
    }

    sendCost += parseFloat(sanitisedResponse.data.cost.amount);
    successArray.push(successNumber);
}

/*
    Handle when sending is complete. Display success and error messagse
*/
async function displayComplete() {
    sendComplete = true;

    await delay(500);

    if (emergencyStop === true) {
        toggleDisabled();
        return;
    }

    const sanitisedSuccessArray = cleanNumbersReturnArray(successArray);
    const sanitisedNumbers = cleanNumbersReturnArray(document.getElementById("phoneNumberInput").value);
    let difference = sanitisedNumbers.filter(x => sanitisedSuccessArray.indexOf(x) === -1);

    accountBalance = accountBalance - sendCost;
    document.getElementById("accountBalance").innerHTML = "<b>Current balance</b>: " + String((accountBalance - sendCost).toFixed(2)) + " " + currencyCode;
    document.getElementById("sentMessages").innerHTML = "<b>" + sanitisedSuccessArray.length + " message(s) sent successfully</b>. Total cost: " + sendCost.toFixed(3) + " " + currencyCode;
    document.getElementById("sendInProgress").innerHTML = "";

    populateFinalErrorMessage(difference, "sendErrors");
    toggleDisabled();
}
