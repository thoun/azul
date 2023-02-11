<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Azul implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * azul.action.php
 *
 * Azul main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/azul/azul/myAction.html", ...)
 *
 */
  
  
  class action_azul extends APP_GameAction { 
    // Constructor: please do not modify
   	public function __default() {
      if (self::isArg( 'notifwindow')) {
        $this->view = "common_notifwindow";
        $this->viewArgs['table'] = self::getArg("table", AT_posint, true);
      } else {
        $this->view = "azul_azul";
        self::trace( "Complete reinitialization of board game" );
      }
  	} 

    public function takeTiles() {
      self::setAjaxMode();

      // Retrieve arguments
      $id = self::getArg("id", AT_posint, true);

      $this->game->takeTiles($id);

      self::ajaxResponse();
    }

    public function undoTakeTiles() {
      self::setAjaxMode();

      $this->game->undoTakeTiles();

      self::ajaxResponse();
    }

    public function selectFactory() {
      self::setAjaxMode();

      // Retrieve arguments
      $factory = self::getArg("factory", AT_posint, true);

      $this->game->selectFactory($factory);

      self::ajaxResponse();
    }

    public function selectLine() {
      self::setAjaxMode();

      // Retrieve arguments
      $line = self::getArg("line", AT_posint, true);

      $this->game->selectLine($line);

      self::ajaxResponse();
    }

    public function confirmLine() {
      self::setAjaxMode();

      $this->game->confirmLine();

      self::ajaxResponse();
    }

    public function undoSelectLine() {
      self::setAjaxMode();

      $this->game->undoSelectLine();

      self::ajaxResponse();
    }

    public function selectColumn() {
      self::setAjaxMode();

      // Retrieve arguments
      $line = self::getArg("line", AT_posint, true);
      $column = self::getArg("column", AT_posint, true);

      $this->game->selectColumn($line, $column);

      self::ajaxResponse();
    }

    public function confirmColumns() {
      self::setAjaxMode();

      $this->game->confirmColumns();

      self::ajaxResponse();
    }

    public function undoColumns() {
      self::setAjaxMode();

      $this->game->undoColumns();

      self::ajaxResponse();
    }

  }
  

