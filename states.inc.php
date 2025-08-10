<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * AsteroidMiningGuild implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * states.inc.php
 *
 * AsteroidMiningGuild game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: $this->checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!


$machinestates = [

    // The initial state. Please do not modify.

    1 => array(
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["newAsteroids" => 2]
    ),

    // Note: ID=2 => your first state
    2 => [
        "name" => "newAsteroids",
        "description" => '',
        "type" => "activeplayer",
        "action" => "stNewAsteroids",
        "transitions" => ["nextDeepScan" => 12]
    ],


    10 => [
        "name" => "deepScan",
        "description" => clienttranslate('${actplayer} must select an asteroid for a deep scan'),
        "descriptionmyturn" => clienttranslate('${you} must select an asteroid for a deep scan'),
        "type" => "activeplayer",
        "action" => "stDeepScan",
        "args" => "getAsteroids", 
        "possibleactions" => array( 'actDeepScan' ),
        "transitions" => ["reorderBoard" => 11]
    ],

    11 => [
        "name" => "reorderBoard",
        "description" => clienttranslate('${actplayer} may reorder cards'),
        "descriptionmyturn" => clienttranslate('${you} may reorder cards'),
        "type" => "activeplayer",
        "args" => "getKnowledge",
        "possibleactions" => ["actReorder"],
        "transitions" => ["nextDeepScan" => 12]
    ],
    
    12 => [
        "name" => "nextDeepScan",
        "description" => '',
        "type" => "game",
        "action" => "stNextDeepScan",
        "updateGameProgression" => true,
        "transitions" => ["surfaceScan" => 20, "deepScan" => 10 ]
    ],

    20 => [
        "name" => "surfaceScan",
        "description" => clienttranslate('${actplayer} must select an asteroid for a surface scan'),
        "descriptionmyturn" => clienttranslate('${you} must select an asteroid for a surface scan'),
        "type" => "activeplayer",
        "args" => "getAsteroids",
        "updateGameProgression" => true,
        "possibleactions" => [
            // these actions are called from the front with bgaPerformAction, and matched to the function on the game.php file
            "actSurfaceScan", 
        ],
        "transitions" => ["displaySurfaceScan" => 21]
    ],

    21 => [
      "name" => "displaySurfaceScan",
      "description" => clienttranslate('${actplayer} is viewing the top card'),
      "descriptionmyturn" => clienttranslate('${you} are viewing the top card '),
      "type" => "activeplayer",
      "args" => "getKnowledge",
      "possibleactions" => ["actSurfaceScanSeen"],
      "transitions" => ["nextSurfaceScan" => 22]
  ],

  22 => [
    "name" => "nextSurfaceScan",
    "description" => '',
    "type" => "game",
    "action" => "stNextSurfaceScan",
    "updateGameProgression" => true,
    "transitions" => ["auction" => 30, "surfaceScan" => 20 ]
  ],

  30 => [
      "name" => "auction",
      "description" => clienttranslate('${actplayer} must select an asteroid to bid on'),
      "descriptionmyturn" => clienttranslate('${you} must select an asteroid to bid on'),
      "type" => "activeplayer",
      "args" => "argAuctionData",
      "possibleactions" => [
         "actBidOrPass"
      ],
      "transitions" => ["pass" => 31, "bid" => 32 ]
  ],

  31 => [
    "name" => "passed",
    "description" => '',
    "type" => "game",
    "action" => "stAuctionPassed",
    "updateGameProgression" => true,
    "transitions" => ["nextPlayer" => 30 ]
  ],

  32 => [
    "name" => "bid",
    "description" => '',
    "type" => "game",
    "action" => "stBid",
    "updateGameProgression" => true,
    "transitions" => ["nextPlayer" => 30 ]
  ],




    // Final state.
    // Please do not modify (and do not overload action/args methods).
    99 => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    ],

];



