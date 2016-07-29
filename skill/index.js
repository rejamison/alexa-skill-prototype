var Alexa = require('alexa-sdk');
var couplets = require('couplets.json');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    // alexa.appId = '';
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'AMAZON.StopIntent': function() {
        this.emit(':tell', 'Goodbye.');
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', 'Goodbye.');
    },
    'Unhandled': function() {
        handleCoupletResponse(this, couplets[0]);
    }
};

// populate the dialog intents from the couplets into the handler
for(var i = 1; i < couplets.length; i++) {
    handlers[couplets[i].intentName] = function(couplet) {
        return function() {
            handleCoupletResponse(this, couplet);
        }
    } (couplets[i]);
}

function handleCoupletResponse(that, couplet) {
    if(couplet.alexaResponse[0].mp3) {
        if(couplet.alexaResponse[0].closeSession) {
            that.emit(':tell', "<audio src=\"https://s3.amazonaws.com/prototype/" + couplet.alexaResponse[0].mp3 + "\"/>");
        } else {
            that.emit(':ask', "<audio src=\"https://s3.amazonaws.com/prototype/" + couplet.alexaResponse[0].mp3 + "\"/>", "<audio src=\"https://s3.amazonaws.com/prototype/" + couplet.alexaResponse[0].mp3 + "\"/>");
        }
    } else {
        if(couplet.alexaResponse[0].closeSession) {
            that.emit(':tell', couplet.alexaResponse[0].dialog);
        } else {
            that.emit(':ask', couplet.alexaResponse[0].dialog, couplet.alexaResponse[0].dialog);
        }
    }
}