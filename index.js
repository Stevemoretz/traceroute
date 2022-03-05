let {IPinfoWrapper} = require("node-ipinfo");
const {exec} = require('./utilities.js')
const ipinfoWrapper = new IPinfoWrapper("99f821c7cb4f88");
const readline = require('readline');

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}


const main = async () => {
    let result = "";

    const parseOutput = async () => {
        console.log('Parsing the result...');
        for (const item1 of result.split("\n").filter((item) => {
            return /.*\((.*?)\).*/gm.test(item);
        })) {
            var ip = item1.replace(/.*\((.*?)\).*/gm, '$1');
            let string = '(' + ip + ') : ';
            if (ip === "192.168.1.1") {
                string += "My Router";
            } else {
                try {
                    await ipinfoWrapper.lookupIp(ip).then((response) => {
                        if (response.bogon) {
                            string += "Bogon IP address";
                        } else if (response?.country) {
                            string += `${response.country} -> ${response?.city}`
                        } else {
                            string += "Unknown Location : " + JSON.stringify(response);
                        }
                    })
                } catch (e) {
                    console.log(e);
                }
                string += "\n";
                process.stdout.write(string);
            }
        }
    }

    const traceroute = (location) => {
        return new Promise((resolve, reject) => {
            askQuestion("Make sure you are not connected to a VPN! Continue?").then(() => {
                exec(`traceroute -m24 ${location}`, (data) => {
                    result += data.toString();
                    process.stdout.write(data);
                }, () => {
                    console.log("** Parsing traceroute command **");
                    askQuestion("Please connect to a vpn now, if you don't have access to ipinfo.io directly. Continue?").then(() => {
                        parseOutput().then(() => resolve());
                    });
                });
            });
        })
    }

    const locations = [
        // Iran, Qazvin
        "www.ikiu.ac.ir",
        // 1200 E California Blvd, Pasadena, CA 91125, United States
        "www.caltech.edu",
        // Cambridge, MA, United States
        "www.mit.edu"
    ];
    for (const location of locations) {
        result = "";
        console.log(`** Running traceroute command for ${location}**`);
        await traceroute(location);
    }
}
main();