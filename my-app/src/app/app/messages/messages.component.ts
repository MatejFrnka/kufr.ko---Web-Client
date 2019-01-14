import { Component, OnInit, NgZone } from '@angular/core';
import { Server } from 'src/app/utility/server.service';
import { GroupInfo } from 'src/app/models/group/group-info.model';
import { SinlgeMessage } from 'src/app/models/messages/single-message.model';
import { UserPublic } from 'src/app/models/people/user-public.model';
import { UserInfo } from 'src/app/models/messages/user-info.model';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  constructor(private server: Server, private router: Router, private ngZone: NgZone) { }
  public Search: string = "";
  //Contorls left panel with people and messages
  public SidePanelNumber: number = 0;

  private groups: GroupInfo[];
  private selectedGroupId: number;

  private friends: UserPublic[];
  private pendingFriends: UserPublic[];
  private searchResult: UserPublic[] = [];
  private searching: boolean = false;

  private messages: { [id: number]: SinlgeMessage[]; } = {};
  private pendingMessages: { [id: number]: SinlgeMessage[]; } = {};
  private messageInput: string = "";
  private messagesElement;
  private loadingMessages: { [id: number]: boolean } = {};
  private allMessagesLoaded: { [id: number]: boolean } = {};

  private currentUser: UserPublic

  private eventOptions: boolean | { capture?: boolean, passive?: boolean };
  ngOnDestroy() {
    this.messagesElement.removeEventListener('scroll', this.loadMoreMessages);
  }
  ngOnInit() {
    this.eventOptions = {
      capture: true,
      passive: true
    };
    this.messagesElement = document.getElementById("messageBody");
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scroll, <any>this.eventOptions);
    });
    this.server.GetGroups()
      .then((response) => {
        this.groups = (response.Data as GroupInfo[]);

        if (this.groups.length != 0) {
          this.selectedGroupId = this.groups[0].Id;
          this.loadMessages(this.selectedGroupId);
        }
      })
      .catch(er => console.log(er));
    this.loadPeople();
    this.loadSelf();
  }
  scroll = (): void => {
    let messageEl = document.getElementById("messageBody");
    if (messageEl.scrollTop <= 30) {
      this.ngZone.run(() => {
        this.loadMoreMessages();
      });
    }
  };
  public loadMoreMessages() {
    let selectedGroup = this.selectedGroupId;
    if ((this.loadingMessages[selectedGroup] == undefined || !this.loadingMessages[selectedGroup]) && (this.allMessagesLoaded[selectedGroup] == undefined || !this.allMessagesLoaded)) {
      this.loadingMessages[selectedGroup] = true;
      this.server.GetMessages(selectedGroup, 20, this.messages[selectedGroup][this.messages[selectedGroup].length - 1].Id).then(response => {
        this.CheckCode(response.StatusCode);
        this.loadingMessages[selectedGroup] = false;
        this.messages[selectedGroup] = this.messages[selectedGroup].concat(response.Data as SinlgeMessage[]);
        if ((response.Data as SinlgeMessage[]).length == 0)
          this.allMessagesLoaded[selectedGroup] = true;
      })
    }
  }
  loadMessages(idGroup: number): SinlgeMessage[] {
    if (this.messages[idGroup] == undefined) {
      let amount = 50;
      this.server.GetMessages(idGroup, amount)
        .then((response) => {
          if((response.Data as SinlgeMessage[]).length<amount)
            this.allMessagesLoaded[idGroup] = true;
          this.messages[idGroup] = response.Data as SinlgeMessage[];
          //document.getElementById("messageBody").scrollTo(0, 500)
          return this.messages[idGroup];
        })
    }
    return this.messages[idGroup];
  }
  getValidGroups(filter: string): GroupInfo[] {
    return this.groups.filter(item => item.Name == filter);
  }
  loadPeople() {
    this.server.GetExistingFriends().then((response) => this.friends = response.Data as UserPublic[]);
    this.server.GetPendingFriends().then((response) => this.pendingFriends = response.Data as UserPublic[]);
  }
  isFirstOfGroup(indexOfMessage: number, idGroup: number) {
    if (indexOfMessage == 0)
      return true;
    if (this.messages[idGroup][indexOfMessage].UserInfo.Id != this.messages[idGroup][indexOfMessage - 1].UserInfo.Id)
      return true;
    return false;
  }
  isLastOfGroup(indexOfMessage: number, idGroup: number) {
    if (indexOfMessage == this.messages[idGroup].length - 1)
      return true;
    if (this.messages[idGroup][indexOfMessage].UserInfo.Id != this.messages[idGroup][indexOfMessage + 1].UserInfo.Id)
      return true;
    return false;
  }
  sendMessage() {
    let group = this.selectedGroupId;
    let messageText = this.messageInput;
    this.messageInput = "";

    let tempMessage = new SinlgeMessage();
    tempMessage.Text = messageText;
    tempMessage.UserInfo = new UserInfo();
    tempMessage.UserInfo.Id = this.currentUser.Id;
    tempMessage.UserInfo.Id_Attachment = this.currentUser.Id_Attachment;
    tempMessage.Edited = false;
    tempMessage.Id_Group = group;

    if (this.pendingMessages[group] == undefined)
      this.pendingMessages[group] = [];
    this.pendingMessages[group].push(tempMessage);

    this.server.SendMessage([], group, messageText).then((response) => {
      this.CheckCode(response.StatusCode);
      this.server.GetNewMessages([group], this.messages[group][0].Id).then((response) => {
        this.CheckCode(response.StatusCode);
        if (response.StatusCode == 0) {
          this.messages[group] = this.joinMessages((response.Data as SinlgeMessage[]), this.messages[group]);
        } else {
          console.log("Error code: " + response.StatusCode)
        }
        this.pendingMessages[group] = undefined;
      })
    });
  }
  joinMessages(arrayA: SinlgeMessage[], arrayB: SinlgeMessage[]): SinlgeMessage[] {
    arrayB.forEach(element => {
      let alreadyIn: boolean = false;
      arrayA.forEach(item => {
        if (item.Id == element.Id)
          alreadyIn = true;
      });
      if (!alreadyIn)
        arrayA.push(element)
    });
    return arrayA;
  }
  trimStr(str: string, maxLength: number): string {
    if (str.length > maxLength)
      str = str.substring(0, maxLength - 2) + "..";
    return str;
  }
  loadSelf() {
    this.server.GetSelf().then((response) => this.currentUser = response.Data as UserPublic)
  }
  findGroupById(groupId: number): GroupInfo {
    if (groupId == undefined || groupId == null)
      return new GroupInfo();
    return this.groups.find((a) => a.Id == groupId);
  }
  calcLastOnline(lastOnline: Date): string {
    //TODO: finish
    return "• Online";
  }
  changeUserStatus(UserId: number, Status: number) {
    this.server.UpdateFriendStatus(UserId, Status).then((response) => {
      this.CheckCode(response.StatusCode);
      this.loadPeople();
    })
  }
  private prevSearchRequest : Subscription = null;
  searchForPeople(SearchVal){
    if(this.prevSearchRequest != null){
      this.prevSearchRequest.unsubscribe();
    }
    this.searching = true;
    this.prevSearchRequest = this.server.SearchFriend(SearchVal).subscribe((response)=> {
      this.searchResult = response.Data as UserPublic[];
      this.searching = false;
    })
  }
  private CheckCode(StatusCode: number) {
    if (StatusCode == 2) {
      this.router.navigate(["login"])
    }
  }
}