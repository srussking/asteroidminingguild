/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * AsteroidMiningGuild implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * asteroidminingguild.js
 *
 * AsteroidMiningGuild user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.asteroidminingguild", ebg.core.gamegui, {
        constructor: function(){
            console.log('asteroidminingguild constructor');
              
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;

        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            console.log( "Starting game setup",gamedatas );

            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="table"><div class="board_market_container"><div id="bidding_boards"></div><div class="market_wrapper"><div id="market"></div></div></div><div id="player_tables"></div></div>
            `);
            var num_players = Object.entries(gamedatas.players).length
            var pcv = gamedatas.player_count_variables
            var market_col = gamedatas.market
            var market = Object.entries(market_col)[0][1]
            var market_arr = [{col: "iron", inc: 2},{col: "lead", inc: 3},{col: "copper", inc: 4},{col: "gold", inc: 5}]
            for(var i = 0; i < market_arr.length; i++){
              var m = market_arr[i];
              var id = `market_column_${m.col}`
              var curr_val = parseInt(market[m.col])
              document.getElementById('market').insertAdjacentHTML('beforeend', `<div id="${id}" class="market_column"></div>`)
              for(var j = 0; j < (pcv.rounds + 4) ; j++){ //rounds + num jokers + starting value
                var current = curr_val == j
                var val = j * m.inc
                document.getElementById(id).insertAdjacentHTML('beforeend',`<div id="${id}_${val}" class="val_box_container ${current ? 'current': ''}"><div class="box"></div><div class="value">${val}</div></div>`)
              }
            }


            
            // Setting up player boards
            Object.values(gamedatas.players).forEach(player => {
                // example of setting up players boards
                this.getPlayerPanelElement(player.id).insertAdjacentHTML('beforeend', `
                    <div id="player_counter_${player.id}"><div class="space_bucks">ß ${player.money}</div></div>
                `);

                // example of adding a div for each player
                document.getElementById('player_tables').insertAdjacentHTML('beforeend', `
                    <div id="player_table_${player.id}">
                        <strong>${player.name}</strong>
                        <div>Player zone content goes here</div>
                    </div>
                `);
            });
            var last_asteroid = -1;
            gamedatas.cards.map(function(v){ 
              if(v.card_location_arg != last_asteroid){
                last_asteroid = v.card_location_arg
                document.getElementById('bidding_boards').insertAdjacentHTML('beforeend', `<div id='asteroid_${v.card_location_arg}' data-id='${v.card_location_arg}' class='asteroid'><div class='cards'></div></div>`)
              }
              // document.getElementById(`asteroid_${v.card_location_arg}`).querySelector('.cards').insertAdjacentHTML('beforeend', `<div id='card_${v.card_id}' class='card' data-order='${v.card_order}' data-id='${v.card_id}'></div>`)
            })
            
            document.getElementById('close_modal_button').addEventListener('click', this.close_modal)            
 
            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );
        },

        setupAsteroidListeners: function(args, reorder){ 
          console.log(`setup asteroid listeners`, args, reorder)
          if(reorder && this.isCurrentPlayerActive() ){
            console.log(args.knowledge)
            var knowledge = JSON.parse(args.knowledge[0].knowledge)
            if(!knowledge){ return;}
            this.notif_deepScanResult({args: {cards: knowledge.deep_scan.cards}})
            var cur_asteroid = knowledge.deep_scan.asteroid
            document.getElementById(`asteroid_${cur_asteroid}`).addEventListener('click', e => this.reopenAsteroid(knowledge))
          } else if(this.isCurrentPlayerActive()){
            document.querySelectorAll('.asteroid').forEach(a => a.addEventListener('click', e => this.onClickAsteroid(e, "actDeepScan")));
          } else {
            //no listeners for you cove
          }
        },

        setupSurfaceScanListeners: function(){
          document.querySelectorAll('.asteroid').forEach(a => a.addEventListener('click', e => this.onClickAsteroid(e, "actSurfaceScan")));
        },

        displaySurfaceScan: function(args){
          if(this.isCurrentPlayerActive()){
            var knowledge = JSON.parse(args.args.knowledge[0].knowledge)
            var surface_scan = knowledge.surface_scan
            console.log("surface scan", surface_scan)
            this.notif_surfaceScanResult({args: {card: surface_scan.card}})
            document.getElementById(`asteroid_${surface_scan.asteroid}`).addEventListener('click', e => this.reopenAsteroid(surface_scan))
          }
        },

        reopenSurfaceScan: function(surface_scan){
          this.notif_surfaceScanResult({args: {card: surface_scan.card}})
        },

        reopenAsteroid: function(knowledge){
          this.notif_deepScanResult({args: {cards: knowledge}})
        },

        onClickAsteroid: function(e, action){
          console.log("onClickAsteroid", e, action)
          var el = e.currentTarget
          var asteroid_id = el.getAttribute('data-id')
          this.bgaPerformAction(action, { 
              id: asteroid_id,
          });       
        },

        onClickPass: function(e,action){
          this.bgaPerformAction(action, { })
        },

        closeModalAndClearClickListeners: function(){
          this.close_modal();
          //remove any click listeners
          document.querySelectorAll('.asteroid').forEach(el => {
            const newDiv = el.cloneNode(true); // true clones child elements too
            el.parentNode.replaceChild(newDiv, el);
          });
        },

        setupBidding: function(args){
          console.log("setup bidding", args)
          var that = this

          if(this.isCurrentPlayerActive()){
            document.querySelectorAll('.asteroid').forEach(a => a.addEventListener('click', e => this.openBidModal(e,args)));
            document.getElementById('generalactions').insertAdjacentHTML('beforeend',"<button id='auction_pass'>PASS</button>")
            document.getElementById('auction_pass').addEventListener('click', e => this.onClickPass(e, 'actBidOrPass'));
  
          } else {
            const el = document.getElementById('auction_pass')
            if(el){
              el.remove()
            }
          }
          document.querySelectorAll('.bids').forEach(b => b.remove())
          document.querySelectorAll('.asteroid').forEach(a => {
           that.addBiddingStatsToAsteroid(a,args)
          })
        },

        openBidModal(e, args){
          var el = e.currentTarget
          var asteroid_id = el.getAttribute('data-id')
          const {min_bid, max_bid, asteroid_knowledge} = this.getBidDeets(asteroid_id, args)

          var html = `
            <div class='bid_modal'>
              <div class='bid_container'>
                <label for="bid_amount_${asteroid_id}">Bid: 
                <input id='bid_amount_${asteroid_id}' name="bid_amount_${asteroid_id}" type='number' min='${min_bid}' max='${max_bid}' value='${min_bid}'></input>
                <button id='bid_button'>Bid</button>
              </div>
              <div class='knowledge'>
                ${asteroid_knowledge.deep_scan ? this.getKnowledgeHtml(asteroid_knowledge.deep_scan.cards) : ""}
                ${asteroid_knowledge.surface_scan ? this.getKnowledgeHtml(asteroid_knowledge.surface_scan.card) : ""}
              </div>
            </div>
          `

          this.show_modal(`Asteroid Bid`, html)
          document.getElementById('bid_button').addEventListener('click',(e) => {
            var bid_amount = document.getElementById(`bid_amount_${asteroid_id}`).value
            this.bgaPerformAction('actBidOrPass', { 
                id: asteroid_id,
                bid_amount
            }); 
            this.close_modal()
          })

        },

        getKnowledgeHtml(cards){
          var that = this;
          var html = ''
          if(cards.length == 1){
            html += `<div class='scan surface_scan'>Surface Scan: <ol><li> ${this.getCardReadout(cards[0])}</li></ol></div>`
          } else if(cards.length > 1) {
            html += '<div class="scan deep_scan">Deep Scan: <ol>'
            cards.forEach(c => {
              html += `<li>${that.getCardReadout(c)}</li>`
            })
            html += "</ol></div>"
          }
          return html
        },

        getBidDeets(asteroid_id, args){
          var {bids,knowledge,players} = args.args;
          var min_bid = 1
          var all_known = JSON.parse(knowledge[0].knowledge)
          var asteroid_knowledge = {}
          if(all_known.deep_scan && parseInt(all_known.deep_scan.asteroid) == parseInt(asteroid_id)){
            asteroid_knowledge["deep_scan"] = all_known.deep_scan
          }

          if(all_known.surface_scan && parseInt(all_known.surface_scan.asteroid) == parseInt(asteroid_id)){
            asteroid_knowledge["surface_scan"] = all_known.surface_scan
          }

          var active_player = args.active_player
          var player = players.filter(v => v.player_id == active_player)
          var max_bid = player[0].money
          var current_bid_on_asteroid = bids.filter(v => v.asteroid_id == asteroid_id)
          if(current_bid_on_asteroid.length > 0){
            min_bid = parseInt(current_bid_on_asteroid[0].bid_amount) + 1
          }
          return {min_bid,max_bid,asteroid_knowledge}
        },

        addBiddingStatsToAsteroid: function(asteroid, args){
          console.log("add bidding details", asteroid, args)
          var that = this;
          var asteroid_id = parseInt(asteroid.getAttribute('data-id'))
          asteroid.insertAdjacentHTML('beforeend', `<div class='bids' id='bids_${asteroid_id}'></div>`)
          args.args.players.forEach(p => {
            try {
              document.getElementById("bids_" + asteroid_id).insertAdjacentHTML('beforeend', `
                <div class="player_bid"><span style="color: #${p.player_color}">${p.player_name}</span>: ${p.passed == '1' ? "Passed" : that.getBidFor(asteroid_id,p.player_id,args.args.bids)}
              `)
            } catch(e) {
              console.log(e.message)
            }

          })
        },

        getBidFor: function(asteroid_id,player_id,bids){
          var bid = bids.filter(b => b.asteroid_id == asteroid_id && b.player_id == player_id);
          if(bid.length > 0){
            bid.sort((a,b) => a.bid_amount > b.bid_amount)
            return bid[0].bid_amount
          } else {
            return "No bid"
          }
        },

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName, args );
            
            switch( stateName )
            {
            case 'deepScan':
              this.setupAsteroidListeners(args.args,false);
              break;
            case 'reorderBoard': 
              this.setupAsteroidListeners(args.args,true);
              break;
            case 'nextDeepScan':
            case 'nextSurfaceScan':
              this.closeModalAndClearClickListeners()
              break;  
            case 'surfaceScan':
              this.setupSurfaceScanListeners();
              break;
            case 'displaySurfaceScan':
              this.displaySurfaceScan(args);
              break;
            case 'auction':
              this.setupBidding(args);
              break;

            
            case 'dummy':
                break;
            
            default:
              console.log("missing game state", stateName,args)
          }
          
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */
           
           
            case 'dummy':
                break;
            }               
        }, 

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //        
        onUpdateActionButtons: function( stateName, args )
        {
            console.log( 'onUpdateActionButtons: '+stateName, args );
                      
            if( this.isCurrentPlayerActive() )
            {            
                switch( stateName )
                {
                 case 'playerTurn':    
                    const playableCardsIds = args.playableCardsIds; // returned by the argPlayerTurn

                    // Add test action buttons in the action status bar, simulating a card click:
                    playableCardsIds.forEach(
                        cardId => this.statusBar.addActionButton(_('Play card with id ${card_id}').replace('${card_id}', cardId), () => this.onCardClick(cardId))
                    ); 

                    this.statusBar.addActionButton(_('Pass'), () => this.bgaPerformAction("actPass"), { color: 'secondary' }); 
                    break;
                }
            }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */


        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */
        
        // Example:
        
        onCardClick: function( card_id )
        {
            console.log( 'onCardClick', card_id );

            this.bgaPerformAction("actPlayCard", { 
                card_id,
            }).then(() =>  {                
                // What to do after the server call if it succeeded
                // (most of the time, nothing, as the game will react to notifs / change of state instead)
            });        
        },    

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your asteroidminingguild.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );
            
            // TODO: here, associate your game notifications with local methods
            
            // Example 1: standard notification handling
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            
            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
            // 
          dojo.subscribe('deepScanResult', this, 'notif_deepScanResult');
          this.notifqueue.setSynchronous('deepScanResult', 100);

          dojo.subscribe('surfaceScanResult', this, 'notif_surfaceScanResult');
          this.notifqueue.setSynchronous('surfaceScanResult', 100);
      
        },  

        notif_surfaceScanResult: function(notif){
          console.log("surface scan result", notif)
          var card = notif.args.card[0]
          var html = (`<ul id="card_list" style="list-style:none; padding:0;">
                        <li data-id='${card.card_id}'>${this.getCardReadout(card)}</li>
                      </ul>
                      <button id="surface_scan_seen">DONE</button>
                      `);
          this.show_modal('Top card revealed', html);
          document.getElementById('surface_scan_seen').addEventListener('click',(e) => {
            this.onSurfaceScanDone(e)
          })
        },

        onSurfaceScanDone: function(e){
          e.preventDefault()
          this.bgaPerformAction("actSurfaceScanSeen"); 
          this.close_modal();
        },


        notif_deepScanResult: function (notif) {
          if(this.isCurrentPlayerActive()){
            var cards = notif.args.cards
            var html = '<ul id="card_list" style="list-style:none; padding:0;">';
            cards.forEach(card => {
              html += `<li data-id='${card.card_id}'><button class="move_up_button">^</button> ${this.getCardReadout(card)}</li>`;
            });
            html += '</ul>';

            html += '<button id="reorder_done">DONE</button>'

            this.show_modal('Asteroid Revealed', html);
            this.attachMoveUpHandlers();
            this.updateMoveUpButtons();
            document.getElementById('reorder_done').addEventListener('click',(e) => {
              this.onReorderDone(e)
            })
          }
        }, 

        getCardReadout: function(card) {
          return `Suit ${card.card_type}, Value ${card.card_type_arg}`
        },

        onReorderDone: function(e){
          var ids = []
          document.querySelectorAll('#card_list li').forEach(e => {
            ids.push(e.getAttribute('data-id'))
          })
          this.bgaPerformAction("actReorder", { 
              ids: ids.join(',')
          }); 
        },

         updateMoveUpButtons: function() {
            const listItems = document.querySelectorAll('#card_list li');
            listItems.forEach((li, index) => {
                const btn = li.querySelector('.move_up_button');
                if (btn) {
                    btn.disabled = index === 0;
                }
            });
        },

        attachMoveUpHandlers: function() {
          var that = this;
            document.querySelectorAll('.move_up_button').forEach(button => {
                button.addEventListener('click', function (e) {
                  e.preventDefault()
                    const li = this.closest('li');
                    const prev = li.previousElementSibling;
                    if (prev) {
                        li.parentNode.insertBefore(li, prev);
                        that.updateMoveUpButtons();
                    }
                });
            });
        },

        show_modal: function (title, content_html) {
          dojo.byId('modal_title').innerHTML = title;
          dojo.byId('modal_content').innerHTML = content_html;
          dojo.style('modal_overlay', 'display', 'flex');
        },

        close_modal: function () {
          dojo.style('modal_overlay', 'display', 'none');
        }

        
        // TODO: from this point and below, you can write your game notifications handling methods
        
        /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
            
            // TODO: play the card in the user interface.
        },    
        
        */
   });             
});
