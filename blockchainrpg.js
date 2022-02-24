// ==UserScript==
// @name         blockchainrpg
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://play.blockchainrpg.io/
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    console.log("[Script]", "Script loading.");

    var account;
    var player;
    var heal;
    var huntConfig = {
        // config here
        1:{'map':'swamplands','hp':18},
        2:{'map':'forest','hp':78}
    }
    var huntTarget = 1;
    var endPoint = 'https://wax.eu.eosamsterdam.net';

    function getData() {
        get_account();
    }

    function get_account() {
        let datas = JSON.stringify({
            'account_name': 'uebay.wam',
        });
        GM_xmlhttpRequest({
            method: 'POST',
            url: endPoint + '/v1/chain/get_account',
            headers: { 'Content-Type': 'application/json' },
            data: datas,
            onload: function (response) {
                account = JSON.parse(response.responseText);
                // console.log(account);
                if (account == undefined) return;
                console.log("[Script]", 'task', 'cpu', account['cpu_limit']['available'], 'net', account['net_limit']['available']);
                if (account['cpu_limit']['available'] <= 1000) return;
                if (account['net_limit']['available'] <= 0) return;
                get_player();
            },
            onerror: function (response) {
                console.error("[Script]", 'get_account fail');
            }
        });
    };

    function get_player() {
        let datas = JSON.stringify({
            code: "unapologetic",
            index_position: 1,
            json: true,
            key_type: "",
            limit: 1,
            lower_bound: "uebay.wam",
            reverse: false,
            scope: "unapologetic",
            show_payer: false,
            table: "players",
            upper_bound: "",
        });
        GM_xmlhttpRequest({
            method: 'POST',
            url: endPoint + '/v1/chain/get_table_rows',
            headers: { 'Content-Type': 'application/json' },
            data: datas,
            onload: function (response) {
                player = JSON.parse(response.responseText);
                // console.log(player);
                if (player == undefined) return;
                if (new Date(player['rows'][0]['cooldownEnd'] + 'Z') - new Date() > -30) return;
                task();
            },
            onerror: function (response) {
                console.error("[Script]", 'get_player fail');
                player = undefined;
            }
        });
    }

    function get_heal() {
        let datas = JSON.stringify({
            code: "unapologetic",
            index_position: 1,
            json: true,
            key_type: "",
            limit: 1,
            lower_bound: "uebay.wam",
            reverse: false,
            scope: "unapologetic",
            show_payer: false,
            table: "heals",
            upper_bound: ""
        });
        GM_xmlhttpRequest({
            method: 'POST',
            url: endPoint + '/v1/chain/get_table_rows',
            headers: { 'Content-Type': 'application/json' },
            data: datas,
            onload: function (response) {
                heal = JSON.parse(response.responseText);
                // console.log(heal);
                if (heal == undefined) return;
                if (heal['rows'][0]['healTimes'].length == 5) {
                    var cd = parseInt(82800 - parseInt(new Date() - new Date(heal['rows'][0]['healTimes'][0]+"Z")) / 1000);
                    if (cd > 0) {
                        console.log("[Script]","Heal CD:", cd);
                        return;
                    }
                }
                console.log("[Script]", 'FreeHeal');
                ReactUnityWebGL.FreeHeal(player['rows'][0]['cooldownEnd']);
            },
            onerror: function (response) {
                console.error("[Script]", 'get_heal fail');
                player = undefined;
            }
        });
    }

    function task() {
        for (let i in player['rows'][0]['stats']) {
            let t = player['rows'][0]['stats'][i]
            if (t['key'] == 'CURRHP') {
                console.log("[Script]", "hp", parseInt(t['value']));
                if (parseInt(t['value']) <= huntConfig[huntTarget]['hp']) {
                    get_heal();
                } else {
                    console.log("[Script]", 'Hunt');
                    ReactUnityWebGL.Hunt(huntConfig[huntTarget]['map'], player['rows'][0]['cooldownEnd']);
                }
                break;
            }
        }
    }
    setInterval(() => { getData() }, 20000);

    console.log("[Script]", "Script loaded.");
})();
