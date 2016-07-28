var fs = require('fs');

function processAlexaDialog(str) {
    // trim off "alexa:"
    var dialog = str.trim().substring(6).trim();
    var mp3 = null;
    var closeSession = false;

    // grab the MP3 filename if it has one
    var pipe_pos = dialog.indexOf('|');
    if(pipe_pos >= 0) {
        mp3 = dialog.substring(pipe_pos + 1);
        dialog = dialog.substring(0, pipe_pos);

        // check that the file is inside ../assets/clips
        fs.accessSync('../assets/clips/' + mp3);
    }

    // replace [PAUSE] with SSML tag
    dialog = dialog.replace(/\[PAUSE\]/g, "<break time='1000ms'/>");

    // check for a <stop/> signal, meaning we should not prompt
    if(dialog.indexOf('<stop/>') >= 0) {
        dialog = dialog.replace("<stop/>", "");
        dialog = dialog.replace("<stop>", "");
        closeSession = true;
    }

    return {
        dialog: dialog,
        mp3: mp3,
        closeSession: closeSession
    };
}

function processUserDialog(str) {
    // trim off "user:"
    var dialog = str.trim().substring(5).trim();
    var mp3 = null;

    // grab the MP3 filename if it has one
    var pipe_pos = dialog.indexOf('|');
    if(pipe_pos >= 0) {
        mp3 = dialog.substring(pipe_pos + 1);
        dialog = dialog.substring(0, pipe_pos);

        // check that the file is inside ../assets/clips
        fs.accessSync('../assets/clips/' + mp3);
    }

    // strip out anything in brackets [], ()
    dialog = dialog.replace(/\s*\[.*?\]\s*/g, "");
    dialog = dialog.replace(/\s*\(.*?\)\s*/g, "");

    // remove punctuation
    dialog = dialog.replace(/\./g, " ");
    dialog = dialog.replace(/ \'/g, " ");
    dialog = dialog.replace(/\?/g, " ");
    dialog = dialog.replace(/\"/g, "");
    dialog = dialog.replace(/\,/g, " ");
    dialog = dialog.replace(/\;/g, "");
    dialog = dialog.replace(/\!/g, " ");

    // get rid of any extraneous spaces
    dialog = dialog.replace(/    /g, " ");
    dialog = dialog.replace(/   /g, " ");
    dialog = dialog.replace(/  /g, " ");

    return {
        dialog: dialog,
        mp3: mp3
    };
}

var encoderRing = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
function alphabeticIntentName(num) {
    var prefix = "";
    var value = num;

    if(value == 0) {
         prefix = encoderRing[0];
    } else {
        while(value > 0) {
            prefix = encoderRing[value % encoderRing.length] + prefix;
            value = Math.floor(value / encoderRing.length);
        }
    }

    return prefix + "Intent";
}

fs.readFile('script.txt', 'utf8', function(err, data) {
   if(err) {
       return console.log(err);
   }

    // split the script into couplets.  A couplet is the user dialog and alexa's reply to that dialog.
    console.log("--Processing Script-------------------------");
    var lines = data.split('\n');
    var couplets = [];
    for(var i = 0; i < lines.length;) {
        if(lines[i].trim().toLowerCase().indexOf("alexa") == 0) {
            couplets.push({
                userDialog: [],
                alexaResponse: [processAlexaDialog(lines[i])]
            });
            i++;
        } else if(lines[i].trim().toLowerCase().indexOf("user") == 0) {
            var couplet = {
                userDialog: [],
                alexaResponse: []
            };

            // skip any blank lines
            while(lines[i].trim().length == 0) i++;

            // grab all the user dialog variations
            while(lines[i].trim().toLowerCase().indexOf("user") == 0) {
                couplet.userDialog.push(processUserDialog(lines[i]));
                i++
            }

            // skip any blank lines
            while(lines[i].trim().length == 0) i++;

            couplet.alexaResponse.push(processAlexaDialog(lines[i]));
            i++;

            couplets.push(couplet);
        } else {
            // console.log("Discarding line without a known actor: " + lines[i]);
            i++;
        }
    }

    // write an intent schema, creating an intent for each couplet
    console.log("--Generating Intent Schema-------------------------");
    var schema = {
        "intents": [
            {
                "intent": "AMAZON.HelpIntent"
            },
            {
                "intent": "AMAZON.StopIntent"
            },
            {
                "intent": "AMAZON.CancelIntent"
            }
        ]
    };
    for(var j = 0; j < couplets.length; j++) {
        couplets[j].intentName = alphabeticIntentName(j);
        schema.intents.push({intent: alphabeticIntentName(j)});
    }

    // look for any user dialogs where the utterances match exactly
    for(var j = 0; j < couplets.length; j++) {
        eachCouplet:
            for(var k = 0; k < couplets.length; k++) {
                if(j != k) {
                    var a = couplets[j];
                    var b = couplets[k];

                    for(var j2 = 0; j2 < a.userDialog.length; j2++) {
                        for(var k2 = 0; k2 < b.userDialog.length; k2++) {
                            var a_dialog = a.userDialog[j2].dialog;
                            var b_dialog = b.userDialog[k2].dialog;

                            if(a_dialog == b_dialog) {
                                console.log('Found duplicate user dialogs:');
                                console.log('  a:  ' + JSON.stringify(a));
                                console.log('  b:  ' + JSON.stringify(b));

                                if(a.altIntentNames == null) {
                                    a.altIntentNames = [b.intentName];
                                } else {
                                    a.altIntentNames.push(b.intentName);
                                }

                                break eachCouplet;
                            } else {
                                // console.log(a_dialog + ' != ' + b_dialog);
                            }
                        }
                    }
                }
            }
    }

    // write sample utterances
    console.log("--Sample Utterances-------------------------------");
    var output = "";
    for(var j = 0; j < couplets.length; j++) {
        var couplet = couplets[j];
        for(var k = 0; k < couplet.userDialog.length; k++) {
            output += couplet.intentName + " " + couplet.userDialog[k].dialog + "\n";
        }
    }
    fs.writeFile("../skill/sample_utterances.txt", output, function(err) {
        if(err) {
            console.log(err);
            process.exit(1);
        }
    });


    fs.writeFile("../skill/couplets.json", JSON.stringify(couplets), function(err) {
        if(err) {
            console.log(err);
            process.exit(1);
        }
    });
    fs.writeFile("../skill/intent_schema.json", JSON.stringify(schema), function(err) {
        if(err) {
            console.log(err);
            process.exit(1);
        }
    });
});
