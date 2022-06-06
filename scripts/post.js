/*
    Populate the data object and return a stringified version
*/
function populateData(postDetails, index) {
    let dataObject = {
        "to": postDetails.numberArray[index],
        "text": postDetails.smsMessage
    }

    const alphanumbericCheck = document.getElementById("alphanumericCheck");

    if (alphanumbericCheck.checked) {
        dataObject.from = postDetails.alphaNumbericName;
        dataObject.messaging_profile_id = postDetails.messagingProfile;
    } else {
        dataObject.from = postDetails.telnyxNumber;
    }

    return JSON.stringify(dataObject);
}

/* 
    This version of the post message function will send one message
    at a time. It will verify the API has received the message before sending the next.
*/
function sendSMSSynchronous(postDetails, numberArrayLength, index) {
    if (emergencyStop === true) {
        displayComplete();
        return;
    }

    const data = populateData(postDetails, index);
    let xhr = new XMLHttpRequest();

    xhr.open("POST", apiURL.message);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + postDetails.apiKey);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send(data);

    xhr.onload = function () {
        if (sendComplete === true) {
            return;
        }

        if (xhr.status === 200) {
            successTotal++;
            document.getElementById("sentMessages").innerHTML = String(successTotal) + " messages sent of " + String(numberArrayLength);
            sendSuccess(xhr.response);
        } else {
            errorTotal++;
            document.getElementById("sendErrors").innerHTML = "<b>" + String(errorTotal) + " message(s) failed to send</b>";
            handleErrorMessage(xhr.response, xhr.status, numberArrayLength);
        }

        if (index === numberArrayLength - 1) {
            displayComplete();
            return;
        }

        index++;
        sendSMSSynchronous(postDetails, numberArrayLength, index);
    };
}

/* 
    This version of the send message function will send them as quickly as possible.
    There is a chance the API may get overwhelmed if too many messages are sent.

    This is faster.
*/
function sendSMSAsync(postDetails, numberArrayLength) {
    for (let index = 0; index < numberArrayLength; index++) {
        if (emergencyStop === true) {
            break;
        }

        const data = populateData(postDetails, index);
        let xhr = new XMLHttpRequest();

        xhr.open("POST", apiURL.message);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + postDetails.apiKey);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.send(data);

        xhr.onload = function () {
            if (sendComplete === true) {
                return;
            }

            if (xhr.status === 200) {
                successTotal++;
                document.getElementById("sentMessages").innerHTML = String(successTotal) + " messages sent of " + String(numberArrayLength);
                sendSuccess(xhr.response);
            } else {
                errorTotal++;
                document.getElementById("sendErrors").innerHTML = "<b>" + String(errorTotal) + " message(s) failed to send</b>";
                handleErrorMessage(xhr.response, xhr.status, numberArrayLength);
            }

            if (numberArrayLength === (successTotal + errorTotal)) {
                displayComplete();
            }
        };
    }
}

/*
    Get the current account info from the API key used
*/
function getAccountInfo() {
    document.getElementById("accountBalance").innerHTML = "";
    document.getElementById("sendErrors").innerHTML = "";
    document.getElementById("sentMessages").innerHTML = "";

    const apiKey = document.getElementById("apiKey").value;

    let xhr = new XMLHttpRequest();

    xhr.open("GET", apiURL.balance);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + apiKey);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send();

    xhr.onload = function () {
        const sanitisedResponse = JSON.parse(xhr.response);

        if (xhr.status === 200) {
            accountBalance = parseFloat(sanitisedResponse.data.balance);
            document.getElementById("accountBalance").innerHTML = "<b>Current balance</b>: " + sanitisedResponse.data.balance + " " + sanitisedResponse.data.currency;
            currencyCode = sanitisedResponse.data.currency;
            startPhoneNumberCheck();
        } else {
            document.getElementById("accountBalance").innerHTML = "<b>Error</b>: Unable to get account information. Please check your API key and try again.";
        }
    };
}
