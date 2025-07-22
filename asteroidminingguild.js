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
            
            // TODO: Set up your game interface here, according to "gamedatas"
            
 
            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );
        },

        setupNewAsteroids: function(args){ 
          console.log("add new asteroids", args);
          var last_asteroid = -1
          args.cards.map(function(v){ 
            if(v.card_location_arg != last_asteroid){
              last_asteroid = v.card_location_arg
              document.getElementById('bidding_boards').insertAdjacentHTML('beforeend', `<div id='asteroid_${v.card_location_arg}' class='asteroid'><div class='cards'></div></div>`)
            }
            document.getElementById(`asteroid_${v.card_location_arg}`).querySelector('.cards').insertAdjacentHTML('beforeend', `<div id='card_${v.card_id}' class='card' data-order='${v.card_order}' data-id='${v.card_id}'></div>`)
          })
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
            case 'newAsteroids':
              this.setupNewAsteroids(args.args)
              break;
            case 'argDeepScan':
              console.log("argDeepScan",args);
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
        },  
        
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
