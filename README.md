# SMS-Bulk-Sender
SMS message bulk sender using the Telnyx API

Use the Telnyx API to bulk send SMS services. This project does initial checks of the numbers. It calculates how many SMS' the input text will be split into to help estimate send costs. There is the option to send the message with an alphanumeric title instead of the number. This will require a Telnyx messaging profile being created and the unique ID being used.
To try this out before self hosting use https://sms.lily-pad.uk where this code is hosted.

Install:
Configure a webserver and copy the contents of this repository into the directory.

TODO:
More comprehensive error handling</br>
Enable send all function to speed up message sending</br>
Enable store details in cookies</br>
Enable resume sending if the page is closed before all numbers are messaged
