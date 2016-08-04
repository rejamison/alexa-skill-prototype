# alexa-skill-prototype

Builds prototype skills from a text-based script.  Works in a Mac or Unix environment and this manual assumes you already have an AWS account (https://console.aws.amazon.com) and a Developer account (https://developer.amazon.com).  To use it:

## 1. Clone the repository:

```bash
git clone git@github.com:rejamison/alexa-skill-prototype.git
```

##  2. Write your script.  

In ./cli/, there's a text file called 'script.txt'.  The Skill will be generated out of this script.  The file has the format:

```
Alexa: Yo, what's up?

User: What's happening?
    User:  How are you today?
    Alexa:  I'm pretty awesome, how are you?
    
    User:  I'm great.
        User:  Prettty good.
        User:  Not bad.
        User:  I'm good.
        User:  Good.
        Alexa:  Sweet<stop/>
        
    User:  Not so good.
        User:  Crappy.
        User:  Not so hot.
        Alexa:  Bummer<stop/>
```

The initial "Alexa:" line is what the Skill will say if opened without an intent.  Subsequent blocks starting with a "User:" line represent dialog the skill will respond to.  You can include multiple "User:" lines in a row to represent variations that will be handled with the same response.  Alexa responds with the "Alexa:" line following the "User:" lines.
 
In the example above, if you open the skill with "Alexa, ask prototype what's happening", it replies with "I'm pretty awesome thanks."

By default, the skill will leave the dialog open, but you can add `<stop/>` to the end of the Alexa dialog to close the session instead.

## 3. Setup AWS CLI

The project includes a deployment script that uses AWS CLI.  Instructions for installing it and configuring with your AWS keys is here:  http://docs.aws.amazon.com/cli/latest/userguide/installing.html

## 4. Setup a Lambda.

Go to https://console.aws.amazon.com/lambda/ and setup a Lambda function called "Prototype".  You don't have to use a template, select "Alexa Skills Kit" as the trigger, and you can just accept all the defaults.

## 5. Deploy your skill's code.

At the root of the project, execute the "deploy_skill.sh" script, which will generate the skill code from the script and deploy it to your lambda function.

```bash
./deploy-skill.sh
```

## 6. Configure your skill.

Go to https://developer.amazon.com and create a new Alexa skill.
 
1. Click "Alexa" in the header.
2. Click "Get Started" under "Alexa Skills Kit".
3. Click "Add a New Skill".
4. Call the Skill whatever you like and use whatever invocation name you like.
5. Copy the intent schema from ./skill/intent_schema.json
6. Copy the Sample Utterances from ./skill/sample_utterances.txt
7. Set the Lambda ARN to point to the Lambda you created above.
8. Test things out by trying out one of the intents in your script.  In the simulator, try "what's happening".  From an Alexa device connected to your developer account, try "Alexa, ask Prototype what's happening?".

## 7. Enjoy

From here on, you can just modify script.txt and use './deploy-skill.sh' to update the prototype.  

A couple of caveats:
* The indented structure in the file is just for readability.  All the user dialogs will be top-level intents.  That means if you have the same utterance in different dialogs, it's ambiguous which one will get called.  Watch out for that if you want to do multiple dialogs with yes/no repsonses from the user.  Let me know in Github issues if you run into this and it's a problem.

Enjoy!
