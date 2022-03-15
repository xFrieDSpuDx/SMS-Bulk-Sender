/*
    Set cookies - pass in the key name, value and how many days before it expires
*/
function setCookie(keyName, keyValue, expiredays) {
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + (expiredays * 24 * 60 * 60 * 1000));

    let expires = "expires=" + expireDate.toUTCString();

    document.cookie = keyName + "=" + keyValue + ";" + expires + ";path=/";
}

/*
    Get cookie values and return them.
    If key does not exist return ""
*/
function getCookie(keyName) {
    let name = keyName + "=";
    let cookieContent = document.cookie.split(';');

    for (let index = 0; index < cookieContent.length; index++) {
        let selectedValue = cookieContent[index];
        while (selectedValue.charAt(0) == ' ') {
            selectedValue = selectedValue.substring(1);
        }
        if (selectedValue.indexOf(name) == 0) {
            return selectedValue.substring(name.length, selectedValue.length);
        }
    }

    return "";
}

/*
    Check if cookies exist and populate the input values if they do
*/
function checkCookies() {
    currencyCode = getCookie("currencyCode");
    getPhoneNumberLength();

    const smsMessage = decodeURI(getCookie("smsMessage"));
    if (smsMessage !== "") {
        document.getElementById("textMessageInput").value = smsMessage;
        textMessageInputChange(smsMessage);
    }

    const apiKey = getCookie("apiKey");
    if (apiKey !== "") {
        document.getElementById("apiKey").value = apiKey;
        getAccountInfo();
    }

    const telnyxNumber = getCookie("telnyxNumber");
    if (telnyxNumber !== "") {
        document.getElementById("telnyxSendFrom").value = telnyxNumber;
        telnyxSendFromChange();
    }

    const numberArray = decodeURI(getCookie("numberArray"));
    if (numberArray !== "") {
        document.getElementById("phoneNumberInput").value = numberArray;
        phoneNumberInputChange();
    }

    let successArray = getCookie("successArray");
    if (successArray !== "") {
        partialSendArray = successArray.split(",");
        successArray = partialSendArray;
        confirmAction(successArray);
    }
}

async function confirmAction() {
    let confirmAction = confirm("Failed to send to all numbers. Do you want to continue sending?");

    if (confirmAction) {
        sendSMS();
    } else {
        partialSendArray = [];
        setCookie("successArray", "", 7);
    }
}

function setSuccessCookies() {
    setCookie("currencyCode", "", 7);
    setCookie("smsMessage", "", 7);
    setCookie("apiKey", "", 7);
    setCookie("telnyxNumber", "", 7);
    setCookie("numberArray", "", 7);
    setCookie("successArray", "", 7);
}