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
      if ($this->isArg( 'notifwindow')) {
        $this->view = "common_notifwindow";
        $this->viewArgs['table'] = $this->getArg("table", AT_posint, true);
      } else {
        $this->view = "azul_azul";
        $this->trace( "Complete reinitialization of board game" );
      }
  	} 

    public function takeTiles() {
      $this->setAjaxMode();

      // Retrieve arguments
      $id = $this->getArg("id", AT_posint, true);

      $this->game->actTakeTiles($id);

      $this->ajaxResponse();
    }

    public function undoTakeTiles() {
      $this->setAjaxMode();

      $this->game->actUndoTakeTiles();

      $this->ajaxResponse();
    }

    public function selectFactory() {
      $this->setAjaxMode();

      // Retrieve arguments
      $factory = $this->getArg("factory", AT_posint, true);

      $this->game->actSelectFactory($factory);

      $this->ajaxResponse();
    }

    public function selectLine() {
      $this->setAjaxMode();

      // Retrieve arguments
      $line = $this->getArg("line", AT_posint, true);

      $this->game->actSelectLine($line);

      $this->ajaxResponse();
    }

    public function confirmLine() {
      $this->setAjaxMode();

      $this->game->actConfirmLine();

      $this->ajaxResponse();
    }

    public function undoSelectLine() {
      $this->setAjaxMode();

      $this->game->actUndoSelectLine();

      $this->ajaxResponse();
    }

    public function selectColumn() {
      $this->setAjaxMode();

      // Retrieve arguments
      $line = $this->getArg("line", AT_posint, true);
      $column = $this->getArg("column", AT_posint, true);

      $this->game->actSelectColumn($line, $column);

      $this->ajaxResponse();
    }

    public function confirmColumns() {
      $this->setAjaxMode();

      $this->game->actConfirmColumns();

      $this->ajaxResponse();
    }

    public function undoColumns() {
      $this->setAjaxMode();

      $this->game->actUndoColumns();

      $this->ajaxResponse();
    }

  }
  

