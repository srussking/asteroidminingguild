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
 * Game.php
 *
 * This is the main file for your game logic.
 *
 * In this PHP file, you are going to defines the rules of the game.
 */
declare(strict_types=1);

namespace Bga\Games\AsteroidMiningGuild;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

class Game extends \Table
{
    private $cards;
    private static array $CARD_SUITS;
    private static array $CARD_TYPES;

    /**
     * Your global variables labels:
     *
     * Here, you can assign labels to global variables you are using for this game. You can use any number of global
     * variables with IDs between 10 and 99. If your game has options (variants), you also have to associate here a
     * label to the corresponding ID in `gameoptions.inc.php`.
     *
     * NOTE: afterward, you can get/set the global variables with `getGameStateValue`, `setGameStateInitialValue` or
     * `setGameStateValue` functions.
     */
    public function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            "my_first_global_variable" => 10,
            "my_second_global_variable" => 11,
            "my_first_game_variant" => 100,
            "my_second_game_variant" => 101,
        ]);        

        $this->cards = $this->getNew("module.common.deck");
        $this->cards->init("card");

        self::$CARD_SUITS = [
            1 => [
                'name' => clienttranslate('Iron'),
            ],
            2 => [
                'name' => clienttranslate('Lead'),
            ],
            3 => [
                'name' => clienttranslate('Copper'),
            ],
            4 => [
                'name' => clienttranslate('Gold'),
            ],
            5 => [
                'name' => clienttranslate('Joker'),
            ]
        ];

        self::$CARD_TYPES = [
            1 => ['name' => '1'],
            2 => ['name' => '2'],
            3 => ['name' => '3'],
            4 => ['name' => '4'],
            5 => ['name' => '5'],
            6 => ['name' => '6'],
            7 => ['name' => '7'],
            8 => ['name' => '8'],
            9 => ['name' => '9'],
            10 => ['name' => '10'],
            11 => ['name' => '-5'],
            12 => ['name' => '-10'],
            13 => ['name' => '-15'],
            99 => ['name' => 'Joker']
        ];

        /* example of notification decorator.
        // automatically complete notification args when needed
        $this->notify->addDecorator(function(string $message, array $args) {
            if (isset($args['player_id']) && !isset($args['player_name']) && str_contains($message, '${player_name}')) {
                $args['player_name'] = $this->getPlayerNameById($args['player_id']);
            }
        
            if (isset($args['card_id']) && !isset($args['card_name']) && str_contains($message, '${card_name}')) {
                $args['card_name'] = self::$CARD_TYPES[$args['card_id']]['card_name'];
                $args['i18n'][] = ['card_name'];
            }
            
            return $args;
        });*/
    }

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player plays a card, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     *
     * @throws BgaUserException
     */
    public function actPlayCard(int $card_id): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        // check input values
        $args = $this->argPlayerTurn();
        $playableCardsIds = $args['playableCardsIds'];
        if (!in_array($card_id, $playableCardsIds)) {
            throw new \BgaUserException('Invalid card choice');
        }

        // Add your game logic to play a card here.
        $card_name = self::$CARD_TYPES[$card_id]['card_name'];

        // Notify all players about the card played.
        $this->notify->all("cardPlayed", clienttranslate('${player_name} plays ${card_name}'), [
            "player_id" => $player_id,
            "player_name" => $this->getActivePlayerName(), // remove this line if you uncomment notification decorator
            "card_name" => $card_name, // remove this line if you uncomment notification decorator
            "card_id" => $card_id,
            "i18n" => ['card_name'], // remove this line if you uncomment notification decorator
        ]);

        // at the end of the action, move to the next state
        $this->gamestate->nextState("playCard");
    }

    public function actPass(): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        // Notify all players about the choice to pass.
        $this->notify->all("pass", clienttranslate('${player_name} passes'), [
            "player_id" => $player_id,
            "player_name" => $this->getActivePlayerName(), // remove this line if you uncomment notification decorator
        ]);

        // at the end of the action, move to the next state
        $this->gamestate->nextState("pass");
    }

    /**
     * Game state arguments, example content.
     *
     * This method returns some additional information that is very specific to the `playerTurn` game state.
     *
     * @return array
     * @see ./states.inc.php
     */
    public function argPlayerTurn(): array
    {
        // Get some values from the current game situation from the database.

        return [
            "playableCardsIds" => [1, 2],
        ];
    }

    /**
     * Compute and return the current game progression.
     *
     * The number returned must be an integer between 0 and 100.
     *
     * This method is called each time we are in a game state with the "updateGameProgression" property set to true.
     *
     * @return int
     * @see ./states.inc.php
     */
    public function getGameProgression(): int {
        $playerCount = $this->getPlayersNumber();
        $vars = $this->getPlayerCountVariables($playerCount);
        $rounds = $vars['rounds'];
        $asteroid_count = (int) self::getUniqueValueFromDb("SELECT COUNT(asteroid_id) FROM asteroid");
        $asteroids_per_round = $vars['boards'];

        return (int) round((($asteroid_count / $asteroids_per_round ) / $rounds) * 100);
    }

    /**
     * Game state action, example content.
     *
     * The action method of state `nextPlayer` is called everytime the current game state is set to `nextPlayer`.
     */
    public function stNextDeepScan(): void {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        // Give some extra time to the active player when he completed an action
        $this->giveExtraTime($player_id);
        
        $this->activeNextPlayer();

        // Go to another gamestate
        // Here, we would detect if the game is over, and in this case use "endGame" transition instead 
        $this->gamestate->nextState("nextPlayer");
    }

    public function getAsteroids(): array {
      $result = [];
      $result['cards'] = $this->getObjectListFromDB("
          SELECT `card_id`, `card_order`, `card_location_arg`
          FROM `card`
          WHERE `card_location` = 'asteroid'
          ORDER BY card_location_arg ASC, card_order ASC
      ");
      return $result;
    }

    public function stNewAsteroids(): void {
      // Get card count per asteroid based on player count
      $playerCount = $this->getPlayersNumber();
      $vars = $this->getPlayerCountVariables($playerCount);
      $cardsPerAsteroid = $vars['cards'];

      // Create asteroids
      for ($i = 0; $i < $vars['boards']; $i++) {
          // Insert asteroid into DB
          $this->DbQuery("INSERT INTO asteroid (location) VALUES ('space')");
          $asteroidId = $this->DbGetLastId();

          // Put cards on asteroids
          $this->drawCards($cardsPerAsteroid, 'asteroid', $asteroidId);  // Your function to get random cards
      }
    }

  public function actDeepScan(int $id): void {
    self::checkAction('actDeepScan');

    $player_id = self::getActivePlayerId();

    $this->notifyAllPlayers(
      "deepScan",
      clienttranslate('${player_name} reveals asteroid ${asteroid_id}'),
      [
        'player_id' => $player_id,
        'player_name' => $this->getActivePlayerName(),
        'asteroid_id' => $id
      ]
    );

    // Get cards associated with the asteroid
    $cards_for_asteroid = $this->getObjectListFromDB("
      SELECT *
      FROM `card`
      WHERE `card_location` = 'asteroid' AND `card_location_arg` = $id
      ORDER BY `card_location_arg` ASC, `card_order` ASC
    ");

    // TODO: Fix knowledge update — requires structured JSON update, not this
    // Placeholder (you should use proper JSON encoding per player)
    $cards_json = json_encode($cards_for_asteroid);

    $sql = "UPDATE `player`
            SET `knowledge` = '" . self::escapeStringForDB($cards_json) . "'
            WHERE `player_id` = $player_id";
    $this->DbQuery($sql);

    $this->notifyPlayer($player_id, 'deepScanResult', '', [
        'cards' => $cards_for_asteroid
    ]);
  }



    public function argReorderBoard(array $card_ids): void {
      error_log("New id order: " . print_r($card_ids, true));
    }

    /**
     * Migrate database.
     *
     * You don't have to care about this until your game has been published on BGA. Once your game is on BGA, this
     * method is called everytime the system detects a game running with your old database scheme. In this case, if you
     * change your database scheme, you just have to apply the needed changes in order to update the game database and
     * allow the game to continue to run with your new version.
     *
     * @param int $from_version
     * @return void
     */
    public function upgradeTableDb($from_version)
    {
//       if ($from_version <= 1404301345)
//       {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//       }
//
//       if ($from_version <= 1405061421)
//       {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//       }
    }

    /*
     * Gather all information about current game situation (visible by the current player).
     *
     * The method is called each time the game interface is displayed to a player, i.e.:
     *
     * - when the game starts
     * - when a player refreshes the game page (F5)
     */
    protected function getAllDatas(): array
    {
        $result = [];

        // WARNING: We must only return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        // Get information about players.
        // NOTE: you can retrieve some extra field you added for "player" table in `dbmodel.sql` if you need it.
        $result["players"] = $this->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score`, `money` FROM `player`"
        );

        $result["player_count_variables"] = $this->getPlayerCountVariables($this->getPlayersNumber());
        $result["market"] = $this->getCollectionFromDB("SELECT `iron`,`lead`,`copper`,`gold` from `market`");


        // TODO: Gather all information about current game situation (visible by player $current_player_id).

        return $result;
    }

  protected function getPlayerCountVariables($num): array {
    if ($num === 3) {
        return ['cards' => 3, 'boards' => 2, 'rounds' => 9];
    } else if ($num === 4) {
        return ['cards' => 2, 'boards' => 3, 'rounds' => 9];
    } else if ($num === 5) {
        return ['cards' => 2, 'boards' => 4, 'rounds' => 6];
    } else {
        return ['cards' => 2, 'boards' => 5, 'rounds' => 5];
    }
  }

    /**
     * Returns the game name.
     *
     * IMPORTANT: Please do not modify.
     */
    protected function getGameName()
    {
        return "asteroidminingguild";
    }

    /**
     * This method is called only once, when a new game is launched. In this method, you must setup the game
     *  according to the game rules, so that the game is ready to be played.
     */
    protected function setupNewGame($players, $options = [])
    {
        // Set the colors of the players with HTML color code. The default below is red/green/blue/orange/brown. The
        // number of colors defined here must correspond to the maximum number of players allowed for the gams.
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            // Now you can access both $player_id and $player array
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
                50
            ]);
        }

        // Create players based on generic information.
        //
        // NOTE: You can add extra field on player table in the database (see dbmodel.sql) and initialize
        // additional fields directly here.
        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, money) VALUES %s",
                implode(",", $query_values)
            )
        );

        static::DbQuery("INSERT INTO market (iron, lead, copper, gold) VALUES (2,2,2,2)");

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        // Init global values with their initial values.

        // Setup deck
        $cards = [];

        foreach (self::$CARD_SUITS as $suit => $suitInfo) {
            if ($suit != 5) {  // Exclude joker suit from normal cards
                foreach (self::$CARD_TYPES as $value => $valueInfo) {
                    if ($value <= 13) {
                        $cards[] = [
                            'type' => $suit,
                            'type_arg' => $value,
                            'nbr' => 1
                        ];
                    }
                }
            }
        }

        // Add 2 jokers
        $cards[] = [ 'type' => 5, 'type_arg' => 99, 'nbr' => 2 ];

        $this->cards->createCards($cards, 'deck');
        $this->cards->shuffle('deck');

        // Init game statistics.
        //
        // NOTE: statistics used in this file must be defined in your `stats.inc.php` file.

        // Dummy content.
        // $this->initStat("table", "table_teststat1", 0);
        // $this->initStat("player", "player_teststat1", 0);

        // TODO: Setup the initial game situation here.

        // Activate first player once everything has been initialized and ready.
        $this->activeNextPlayer();

        $this->gamestate->nextState("newAsteroids");
    }

    function drawCards($numCards, $to_location = 'hand', $location_arg = null) {
        $cards = $this->cards->pickCardsForLocation($numCards, 'deck', $to_location, $location_arg);

        // Only apply ordering if cards are being sent to an asteroid
        if ($to_location === 'asteroid' && $location_arg !== null) {
            // Re-index and shuffle
            $cards = array_values($cards);
            shuffle($cards);

            // Start ordering from 1 for this asteroid
            $order = 1;

            foreach ($cards as $card) {
                $card_id = (int) $card['id'];

                $this->DbQuery("
                    UPDATE card
                    SET card_order = $order
                    WHERE card_id = $card_id
                ");

                $order++;
            }
        }

        // Debug: log the final shuffled order
        foreach ($cards as $card) {
            error_log("Card picked: ID={$card['id']} type={$card['type']} value={$card['type_arg']}");
        }

        return $cards;
    }


    /**
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: pass).
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use `getCurrentPlayerId()` or `getCurrentPlayerName()`, otherwise it will fail with a
     * "Not logged" error message.
     *
     * @param array{ type: string, name: string } $state
     * @param int $active_player
     * @return void
     * @throws feException if the zombie mode is not supported at this game state.
     */
    protected function zombieTurn(array $state, int $active_player): void
    {
        $state_name = $state["name"];

        if ($state["type"] === "activeplayer") {
            switch ($state_name) {
                default:
                {
                    $this->gamestate->nextState("zombiePass");
                    break;
                }
            }

            return;
        }

        // Make sure player is in a non-blocking status for role turn.
        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new \feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }
}
