import { Component, OnInit } from '@angular/core';
import { Server } from 'src/app/utility/server.service';
import { GroupInfo } from 'src/app/models/group/group-info.model';
import { SinlgeMessage } from 'src/app/models/messages/single-message.model';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  constructor(private server: Server) { }
  //Contorls left panel with people and messages
  public SidePanelNumber: number = 0;

  private groups: GroupInfo[];
  private selectedGroupId: number;

  private messages: { [id: number]: SinlgeMessage[]; } = {};
  ngOnInit() {
    this.server
      .GetGroups()
      .then(response => {
        this.groups = (response.Data as GroupInfo[]);

        if (this.selectedGroupId != 0) {
          this.selectedGroupId = this.groups[0].Id;
          this.server.GetMessages(this.selectedGroupId, 25)
            .then((response) => this.messages[this.selectedGroupId] = response.Data as SinlgeMessage[]);
        }
      })
      .catch(er => console.log(er));
  }

  getMessages(idGroup: number) : SinlgeMessage[] {
    if (this.messages[idGroup] == undefined) {
      this.server.GetMessages(idGroup, 25)
        .then((response) => {
          this.messages[idGroup] = response.Data as SinlgeMessage[];
          return this.messages[idGroup];
        })
    }
    return this.messages[idGroup];
  }
  calcLastOnline(lastOnline: Date): string {
    //TODO: finish
    return "• Online";
  }
}
