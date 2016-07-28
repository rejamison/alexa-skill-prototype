var couplets = require('couplets.json');

// TODO:  Handle the end of the sketch
// TODO:  Implement scoring

exports.handler = function (event, context) {
    try {
        console.log("handler:  event.session.application.applicationId=" + event.session.application.applicationId);

        // if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.bddf39d8-87aa-4400-81b8-3707d0b6b07a") {
        //      context.fail("Invalid Application ID");
        // }

        if(event.session.new) {
            // new session
            console.log("onSessionStarted requestId=" + event.request.requestId + ", sessionId=" + event.session.sessionId + ", userId=" + event.session.user.userId);
        } else {
            // session isn't new, handle it
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

    if(couplets[0].alexaResponse[0].mp3) {
        console.log("found mp3 version: " + couplets[0].alexaResponse[0].mp3)
        callback({ lastCouplet: 0 }, buildSSMLSpeechletResponse("<audio src=\"https://s3.amazonaws.com/parrot-sketch/" + couplets[0].alexaResponse[0].mp3 + "\"/>", couplet.alexaResponse[0].closeSession));
    } else {
        callback({ lastCouplet: 0 }, buildSSMLSpeechletResponse(couplets[0].alexaResponse[0].dialog, couplets[0].alexaResponse[0].closeSession));
    }
}

function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId + ", intent=" + intentRequest.intent.name);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("AMAZON.HelpIntent" === intentName) {
        // TODO:  handle this
    } else if ("AMAZON.StopIntent" === intentName) {
        callback(null, {shouldEndSession: true});
    } else if ("AMAZON.CancelIntent" === intentName) {
        callback(null, {shouldEndSession: true});
    } else {
        var couplet = null;
        for(var i = 0; i < couplets.length; i++) {
            if(couplets[i].intentName == intentName) {
                couplet = couplets[i];
                break;
            }
        }

        if(couplet == null) {
            throw new Error("Invalid intent: " + intentName);
        } else {
            if(couplet.alexaResponse[0].mp3) {
                callback(session.attributes, buildSSMLSpeechletResponse("<audio src=\"https://s3.amazonaws.com/parrot-sketch/" + couplet.alexaResponse[0].mp3 + "\"/>", couplet.alexaResponse[0].closeSession));
            } else {
                callback(session.attributes, buildSSMLSpeechletResponse(couplet.alexaResponse[0].dialog, couplet.alexaResponse[0].closeSession));
            }
        }
    }
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
    // do nothing
}

// --------------- Helpers that build all of the responses -----------------------
function buildSpeechletResponse(output, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + output + "</speak>"
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSSMLRepromptSpeechletResponse(outputText, repromptText) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + outputText + "</speak>"
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: "<speak>" + repromptText + "</speak>"
            }
        },
        shouldEndSession: false
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function buildSSMLSpeechletResponse(output, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + output + "</speak>"
        },
        shouldEndSession: shouldEndSession
    };

}