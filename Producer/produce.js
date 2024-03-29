/*
  Created by Dimov Daniel
  Mobidonia
  daniel@mobidonia.com
  Makes expo app
*/
var firebaseConfig = require('./../firebase_config');
var program = require('commander');
var chalk = require('chalk');
var inquirer = require('inquirer');
var appJSONTemplate = require('./../app.json');
var Spinner = require('cli-spinner').Spinner;
const https = require('https');
const fs = require('fs');

var exec = require('./lib/exec');
const CryptoJS = require("crypto-js");
var Config = require('./config.js');
const isTesting=Config.isTesting;

const pathToPointers="/rab_pointers/";
var IS_CYCLE=false;
var appsInQueue=0;

//EXPRESS
const express = require('express')
const app = express()
const port = 8989;




// define the REsT api to firebase Database
const firebaseAPI = require('apisauce').create({
  baseURL: firebaseConfig.config.databaseURL,
})

// define the REsT api to firebase Database
const cloudFunctionsAPI = require('apisauce').create({
    baseURL:  "https://us-central1-"+firebaseConfig.config.projectId+".cloudfunctions.net/",
  })

//START EXPRESS and Start the App builder
app.get('/', (req, res) => res.send('IN BUILD CYCLE: '+(IS_CYCLE?"YES":"NO")+"<br />APPS IN QUEUE: "+appsInQueue))
app.listen(port, () => {

    console.log(chalk.green('Build system info avilable on localhost:'+port));
    console.log("");

    program
        .parse(process.argv);
            if (program.args.length === 0 || typeof program.args[program.args.length - 1] === 'string') {
                start();
            }

    

});



/**
 * STEP 1. Main start function, displays the initial menu
 */
function start(){

    //SaaS or Regular functions
    var choices=Config.isSaaS?[
        "Make Android app",
        "Make iPhone app",
        "Start build cycle",
        "Exit"
    ]:[
        "Make Android app",
        "Make iPhone app",
        "Exit"];


    //Main List, ask user what to do
    inquirer.prompt(
        [{
            type: "list",
            name: "selector",
            message: "What you want to do next?",
            choices: choices,
            filter: function( val ) { return val; }
        }]
    ).then( answers => {
            var selected=answers.selector.toLowerCase().replace(/\s/g,"");
            if(selected=="makeiphoneapp"||selected=="makeandroidapp"){
                IS_CYCLE=false;
                //But first, check if user has entered confing in firebase_config
                if(firebaseConfig&&firebaseConfig.config&&firebaseConfig.config.apiKey){
                    //ok, we have an API key
                    //But do we have is set up with out database
                    if(firebaseConfig.config.apiKey=="AIzaSyDsPufr5Dhusqal0bB8VDD9N6yv9u0Lo1E"){
                        //This is the prefiled, alert user to enter his data
                        console.log(chalk.red("ERROR 2: Firebase configuration is not connected to your Database. Please read documentation regarding how to set it up."))
                    }else{
                        //ALL ok, proceed with making app
                        makeAnApp(selected);
                    }
                }else{
                    console.log(chalk.red("ERROR 1: Firebase configuration file is not ok"));
                }
                
            }else if(selected=="startbuildcycle"){
                //Start build cycle
                IS_CYCLE=true;
                startBuildCycle();
            }else{
                //EXIT
                process.exit(0);
            }
        }
    );
}

/**
 *
 * Step 2. Start making app, ask for the number
 *
 * @param {String} whatKindOfApp makeiphoneapp or makeandroidapp
 */
function makeAnApp(whatKindOfApp){
    inquirer.prompt([
        {
            type: 'input',
            name: 'app_id',
            message: "What is the APP ID you want to make?",
            validate: function(value) {
                var pass = value.match(
                  /^[0-9]+$/i
                );
                if (pass) {
                  return true;
                }
          
                return 'Please enter a number';
              }
          },
    ]).then(answers => {
            startFetchingAppData(answers.app_id,whatKindOfApp);
      });
}

/**
 *  STEP 2.B
 *  Start the get process for the app data
 *
 * @param {Number} app_id
 * @param {String} whatKindOfApp
 */
function startFetchingAppData(app_id,whatKindOfApp){
    var spinner = new Spinner('%s Fetching App Data..');
        spinner.setSpinnerString('|/-\\');
        spinner.start();

    //Now connect to firebase to get the data
    var path=pathToPointers+"data/"+app_id+".json"
    firebaseAPI.get(path).then(rab_pointers=>{
        if(rab_pointers.data!=null){
            //Pointer exists
            firebaseAPI.get(rab_pointers.data+".json").then(response=>{
                spinner.stop(true);
                makeAppJSON(response.data,whatKindOfApp,rab_pointers.data,app_id);
            })
        }else{
            spinner.stop();
            //Pointer doesn't existin, notify user
            var error="Error 3: The app with ID: "+app_id+" doesn't exists in your database";
            console.log(chalk.red(error));

            //Dead end, notify admin and stop
            notifyAdminAndStop(error);

        }
    })
}
/**
 * STEP 3 Make the app.json
 *
 * @param {Object} response
 * @param {String} whatKindOfApp makeiphoneapp or makeandroidapp
 * @param {String} firebaseMetaPath meta path for the app
 * @param {Number} app_id - app if to make
 */
function makeAppJSON(response,whatKindOfApp,firebaseMetaPath,app_id){
    appJSONTemplate.expo.name=response.name;
    appJSONTemplate.expo.description="Made with react app builder";
    appJSONTemplate.expo.slug=response.name.toLowerCase().replace(/\s/g,"");
    appJSONTemplate.expo.extra.firebaseMetaPath=firebaseMetaPath;
    appJSONTemplate.expo.android.package=response.id;
    appJSONTemplate.expo.ios.bundleIdentifier=response.id;
    
    //Now save in a app.json
    var stringToSave=JSON.stringify(appJSONTemplate, null, 2)
    fs.writeFile((isTesting?"app_test.json":"app.json"), stringToSave, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(chalk.green("Set up of app.json for app "+appJSONTemplate.expo.name+" is done."));
        downloadAppImages(response,whatKindOfApp,app_id);
    }); 

    
    
}
/**
 *
 * Downloads all the images
 * @param {Objec} response
 * @param {String} whatKindOfApp makeiphoneapp or makeandroidapp
 * @param {Number} app_id - app if to make
 */
function downloadAppImages(response,whatKindOfApp,app_id){
    
    //Create the spinner
    var spinner = new Spinner('%s Downloading image...  ');
    spinner.start();

    //Create location to the files
    const appIcon = (isTesting?"./test/images/app.png":"./assets/icons/app.png");
    const appLoading = (isTesting?"./test/images/loading.png":"./assets/icons/loading.png");
    const appLogo = (isTesting?"./test/images/logo.png":"./App/images/logo.png");
    const appNavLogo = (isTesting?"./test/images/navlogo.png":"./App/images/navlogo.png");
    const appSplash = (isTesting?"./test/images/splash.png":"./assets/images/splash.png");

    //Download all the images
    dowloadSingleImage(response.appImage,appIcon,"App logo",spinner,function(){
        dowloadSingleImage(response.appImage,appLoading,"App loading",spinner,function(){
            dowloadSingleImage(response.appLogo,appLogo,"App logo",spinner,function(){
                dowloadSingleImage(response.appNavLogo,appNavLogo,"App Navigation logo",spinner,function(){
                    dowloadSingleImage(response.appSplash,appSplash,"App Splash image",spinner,function(){
                        spinner.stop(true);
                        if(Config.isSaaS){
                            makeTheApp(whatKindOfApp,app_id);
                        }else{
                            informUserAboutNextSteps(whatKindOfApp);
                        }
                        
                    })
                })
            })
        })
    })
}


/**
 * Download image
 *
 * @param {String} imageFile
 * @param {String} locationToSave
 * @param {String} elementName
 * @param {Objec} spinner
 * @param {Funciton} callBack
 */
function dowloadSingleImage(imageFile,locationToSave,elementName,spinner,callBack){
    if(imageFile){
        https.get(imageFile, function(response) {
            response.pipe(fs.createWriteStream(locationToSave));
            console.log(chalk.green(elementName+" is downloaded."));
            setTimeout(callBack,3000);
        });
    }else{
        console.log(chalk.red('Error 4: '+elementName+' is not set'));
        //spinner.stop(true);
        callBack();
    }
    
}

function informUserAboutNextSteps(whatKindOfApp){
    console.log(chalk.green("Great, app is sucesfully set up. Next you need to execute the following commands"));
    console.log(chalk.blue("To run your app on simulator or device locally"));
    console.log(chalk.yellow("expo start"));
    console.log(chalk.blue("To build your app"));
    if(whatKindOfApp=="makeiphoneapp"){
        console.log(chalk.yellow("expo build:ios"))
    }else{
        console.log(chalk.yellow("expo build:android"))
    }
    process.exit(0);
    
}

/**
 *
 * Make the app
 * @param {String} whatKindOfApp makeiphoneapp or makeandroidapp
 * @param {Number} app_id - app if to make
 */
function makeTheApp(whatKindOfApp,app_id){
    if(whatKindOfApp=="makeiphoneapp"){
        //========== IPHONE APP CREATION ==============
        console.log(chalk.green("Start making iPhone app"));

        //Checl if queue object exists 
        var completePath=pathToPointers+"apps_queue/"+app_id+"_ios.json";
        console.log(completePath)
        firebaseAPI.get(completePath).then(response=>{
            if(response.data&&
                response.data.applePasswordEncripted&&response.data.applePasswordEncripted.length>15&&
                response.data.appleUsername&&response.data.appleUsername.length>5){
                    //All ok, start building
                    console.log("Username: "+response.data.appleUsername)
                    var bytes  = CryptoJS.AES.decrypt(response.data.applePasswordEncripted, Config.cryptoString);
                    var plainPass = bytes.toString(CryptoJS.enc.Utf8);
                    //console.log("Password: "+plainPass);

                    //Te build parameters
                    var makeApp = ['mexpo-cli','bi','-c','--managed','expo','--apple-id', response.data.appleUsername ,'--apple-password',plainPass];

                    //Start making
                    exec('npx', makeApp, {cwd:"./"}, function(output){
                        console.log(chalk.cyan('App building completed'));
                        console.log("\n");
                        console.log(chalk.green("iPhone app created, now upload on App Store "));


                        //Publish on App Store
                        var publishParamas = ['mexpo-cli','ui','--apple-id', response.data.appleUsername ,'--apple-id-password',plainPass];
                        exec('npx',publishParamas,{cwd:"./",capture:false}, function(link){
                            emailClientAndUpdateQueue(app_id,"ios","");
                        })
                        
                    });
                }else{
                    var error='Error 6: Apple Username or Password is not set for app: '+app_id;
                    console.log(chalk.red(error));
                    
                    //Dead end, notify admin and stop
                    notifyAdminAndStop(error);
                }
            
        })
        
    
    }else{
        //========== ANDROID APP CREATION ==============
        console.log(chalk.green("Start making Android app"));
        exec('npx', ['mexpo-cli','ba','--managed','expo'], {cwd:"./"}, function(output){
            console.log(chalk.cyan('App building completed'));
            console.log("\n");
            console.log(chalk.green("Android app created. Now send to user"));
            exec('npx',['mexpo-cli','url:apk'],{cwd:"./",capture:true}, function(link){
                if(link&&link.length>10){
                    emailClientAndUpdateQueue(app_id,"android",link)
                }else{
                    var error="ERROR 5: Android app creation failed for id:"+app_id;
                    console.log(chalk.red(error));
                    
                    //Dead end, notify admin and stop
                    notifyAdminAndStop(error);
                }
            })
            
    
        });
    }
    

    
}

function emailClientAndUpdateQueue(appID,aplicationType,link){
    var path="sendNotifyEmail?appID="+appID+"&aplicationType="+aplicationType;
    if(aplicationType=="android"){
        path+="&linkToApk="+encodeURIComponent(link);
    };
    cloudFunctionsAPI.get(path).then(res=>{
        console.log("RESPONSE FROM CLOUD FUNCTIONS: "+JSON.stringify(res));

        //After email is send
        //If we are in build cicle -- Continue
        //If not, Stop
        if(IS_CYCLE){
            //Start build cycle all over
            startBuildCycle();
        }else{
            process.exit(0)
        }
    })
}

function startBuildCycle(){
   
    firebaseAPI.get(pathToPointers+"apps_queue.json").then(response=>{
        if(response.data==null){
            console.log(chalk.yellow("No apps to make now. Try in 1 minute"));
            setTimeout(startBuildCycle,60000);
        }else{

            //Will provide array of appId_type to make
            var keys=Object.keys(response.data); 
            appsInQueue=keys.length;
            var nextAppToMake=(keys[0]).split("_");
            var appId=nextAppToMake[0];
            var appType=nextAppToMake[1];
            console.log("App we are goint to make: App ID: "+appId+" Type: "+appType);
            startFetchingAppData(appId,appType);
        }
       
       

    })
}


function notifyAdminAndStop(message){
    //TODO IMPROUVE - send on email
    console.log(chalk.red(message));
    process.exit(0);
}




