/* 
    This version of the post message function will send one message
    at a time. It will verify the API has received the message before sending the next.
*/
function sendSMSSynchronous(postDetails, numberArrayLength, index) {
    if (emergencyStop === true) {
        displayComplete();
        return;
    }

    const data = JSON.stringify({
        "from": postDetails.telnyxNumber,
        "to": postDetails.numberArray[index],
        "text": postDetails.smsMessage
    });
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

        let data = JSON.stringify({
            "from": postDetails.telnyxNumber,
            "to": postDetails.numberArray[index],
            "text": postDetails.smsMessage
        });

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
            getPhoneNumberLength();
            startPhoneNumberCheck();
        } else {
            document.getElementById("accountBalance").innerHTML = "<b>Error</b>: Unable to get account information. Please check your API key and try again.";
        }
    };
}