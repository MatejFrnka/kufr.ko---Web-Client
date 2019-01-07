import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  constructor() { }
  //Contorls left panel with people and messages
  public SidePanelNumber : number = 1;

  ngOnInit() {
  }
}
