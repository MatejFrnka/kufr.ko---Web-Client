//IF YOU ARE READING THIS, IM SORRY :(, I DIDNT HAVE MUCH TIME OK!
import { Component, OnInit, NgZone, Input } from '@angular/core';
import { Server } from 'src/app/utility/server.service';
import { GroupInfo } from 'src/app/models/group/group-info.model';
import { SingleMessage } from 'src/app/models/messages/single-message.model';
import { UserPublic } from 'src/app/models/people/user-public.model';
import { UserInfo } from 'src/app/models/messages/user-info.model';
import { Router } from '@angular/router';
import { Observable, Subscription, timer } from 'rxjs';
import { FileService } from '../../utility/file.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  constructor(private server: Server, private router: Router, private ngZone: NgZone) { }
  private fileService = new FileService(this.server);
  public Search: string = "";
  //Contorls left panel
  public SidePanelNumber: number = 0;

  private groups: GroupInfo[];

  get selectedGroupId(): number {
    return this._selectedGroupId;
  }
  set selectedGroupId(value) {
    this._selectedGroupId = value;
    this.groups.find(a => a.Id == value).NewMessages = 0
  }
  private _selectedGroupId: number;

  private friends: UserPublic[];
  private pendingFriends: UserPublic[];
  private searchResult: UserPublic[] = [];
  private searching: boolean = false;

  private messages: { [id: number]: SingleMessage[]; } = {};
  private pendingMessages: { [id: number]: SingleMessage[]; } = {};
  private messageInput: string = "";
  private messagesElement;
  private loadingMessages: { [id: number]: boolean } = {};
  private allMessagesLoaded: { [id: number]: boolean } = {};
  private lastUpdated: Date;

  public password: string = ""
  public visibility: number = 0;
  public currentUser: UserPublic = new UserPublic();
  public beingEdited: { [id: string]: boolean } = {};
  public loadingEdit: { [id: string]: boolean } = {};
  public failedEdit: { [id: string]: boolean } = {};

  updateUsername(username: string) {
    this.loadingEdit["username"] = true;
    this.server.UpdateUsername(username).then((response) => {
      this.loadingEdit["username"] = false;
      if (response.StatusCode == 0) {
        this.beingEdited["username"] = false;
        this.failedEdit["username"] = false;
      }
      else {
        this.failedEdit["username"] = true;
      }
    })
  }
  updatePassword(password: string) {
    this.loadingEdit["password"] = true;
    this.server.UpdatePassword(password).then((response) => {
      this.loadingEdit["password"] = false;
      if (response.StatusCode == 0) {
        this.beingEdited["password"] = false;
        this.failedEdit["password"] = false;
      }
      else {
        this.failedEdit["password"] = true;
      }
    })
  }
  updateVisibility(visibility: number) {
    this.loadingEdit["visibility"] = true;
    this.server.UpdateVisibility(visibility).then((response) => {
      this.loadingEdit["visibility"] = false;
      if (response.StatusCode == 0) {
        this.beingEdited["visibility"] = false;
        this.failedEdit["visibility"] = false;
      }
      else {
        this.failedEdit["visibility"] = true;
      }
    })
  }
  updateProfilePic(file: FileList) {
    this.loadingEdit["profile"] = true;
    console.log("asdf");
  }
  deleteSelf() {
    if (confirm("Are you sure you want to delete your account?")) {
      this.server.DeleteAccount();
      this.server.LogOut();
    }
  }
  onTimerEvent() {
    if (this.lastUpdated != undefined) {
      this.server.GetNewMessagesByDate(this.lastUpdated).then((response) => {
        this.lastUpdated = new Date(Date.now());
        (response.Data as SingleMessage[]).forEach(element => {
          if (this.messages[element.Id_Group] != undefined)
            this.messages[element.Id_Group].unshift(element);
          else
            this.messages[element.Id_Group] = [element];

          if (this.groups.find(a => a.Id == element.Id != undefined))
            this.groups.find(a => a.Id == element.Id).NewMessages++;
          else
            console.log("group" + element.Id + "was not found")
        });
      })
    }
  }

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
      setInterval(() => this.onTimerEvent(), 30000);
    });
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
  ngAfterViewChecked() {
    if (this.scrollToBottom) {
      this.messagesElement.scrollTo(50, 100000);
      this.scrollToBottom = false;
    }
  }
  scroll = (): void => {
    let messageEl = document.getElementById("messageBody");
    if (messageEl.scrollTop <= 30) {
      if (messageEl.scrollTop == 0)
        messageEl.scrollTo(0, 1)
      this.ngZone.run(() => {
        this.loadMoreMessages();
      });
    }
  };
  loadSelf() {
    this.server.GetSelf().then((response) => this.currentUser = response.Data as UserPublic)
  }
  isFirstOfGroup(indexOfMessage: number, idGroup: number): boolean {
    return false;
    if (indexOfMessage == 0)
      return false;
    if (this.dateDiff(this.messages[idGroup][indexOfMessage - 1].Sent, this.messages[idGroup][indexOfMessage].Sent) > 300)
      return true;
    return false;
  }
  isLastOfGroup(indexOfMessage: number, idGroup: number): boolean {
    return false;
    if (indexOfMessage == this.messages[idGroup].length - 1)
      return true;
    if (this.messages[idGroup][indexOfMessage].UserInfo.Id != this.messages[idGroup][indexOfMessage + 1].UserInfo.Id)
      return true;
    if (this.dateDiff(this.messages[idGroup][indexOfMessage].Sent, this.messages[idGroup][indexOfMessage + 1].Sent) > 300)
      return true;
    return false;
  }
  private MessageSeen(IdMessage: number) {
    this.server.SetMessageStauts(IdMessage, true);
  }
  getNewMessages(group: number): Promise<any> {
    return this.server.GetNewMessages([group], this.messages[group][0].Id).then((response) => {
      this.CheckCode(response.StatusCode);
      this.messages[group] = this.joinMessages(this.messages[group], (response.Data as SingleMessage[]));
      this.MessageSeen(this.messages[group][0].Id);
      this.lastUpdated = new Date(Date.now());
    })
  }
  loadMoreMessages() {
    if (this.selectedGroupId != undefined) {
      let selectedGroup = this.selectedGroupId;
      if ((this.loadingMessages[selectedGroup] == undefined || !this.loadingMessages[selectedGroup]) && (this.allMessagesLoaded[selectedGroup] == undefined || !this.allMessagesLoaded)) {
        this.loadingMessages[selectedGroup] = true;
        this.server.GetMessages(selectedGroup, 20, this.messages[selectedGroup][this.messages[selectedGroup].length - 1].Id).then(response => {
          this.CheckCode(response.StatusCode);
          this.loadingMessages[selectedGroup] = false;
          this.messages[selectedGroup] = this.messages[selectedGroup].concat(response.Data as SingleMessage[]);
          this.MessageSeen(this.messages[selectedGroup][0].Id);
          if ((response.Data as SingleMessage[]).length == 0)
            this.allMessagesLoaded[selectedGroup] = true;
          this.lastUpdated = new Date(Date.now());
        })
      }
    }
  }
  private scrollToBottom: boolean = false;
  loadMessages(idGroup: number): SingleMessage[] {
    if (this.messages[idGroup] == undefined) {
      let amount = 50;
      this.loadingMessages[idGroup] = true;
      this.server.GetMessages(idGroup, amount)
        .then((response) => {
          this.loadingMessages[idGroup] = false;
          if ((response.Data as SingleMessage[]).length < amount)
            this.allMessagesLoaded[idGroup] = true;
          this.messages[idGroup] = response.Data as SingleMessage[];
          this.MessageSeen(this.messages[idGroup][0].Id);
          this.scrollToBottom = true
          this.lastUpdated = new Date(Date.now());
        });
    }
    return this.messages[idGroup];
  }
  loadPeople() {
    this.server.GetExistingFriends().then((response) => this.friends = response.Data as UserPublic[]);
    this.server.GetPendingFriends().then((response) => this.pendingFriends = response.Data as UserPublic[]);
  }
  sendMessage() {
    let group = this.selectedGroupId;
    let messageText = this.messageInput;
    this.messageInput = "";
    this.scrollToBottom = true;
    let tempMessage = new SingleMessage();
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
      this.getNewMessages(group).then(this.pendingMessages[group] = undefined)
    });
  }
  joinMessages(arrayB: SingleMessage[], arrayA: SingleMessage[]): SingleMessage[] {
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
    if (str != undefined && str.length > maxLength)
      str = str.substring(0, maxLength - 2) + "..";
    return str;
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
    if (Status == 0)
      this.server.DenyFriend(UserId).then(() => this.loadPeople());
    if (Status == 1)
      this.server.AcceptFriend(UserId).then(() => this.loadPeople());
    if (Status)
      this.server.BlockFriend(UserId).then(() => this.loadPeople());
  }
  amountValidGroups(): number {
    let result = null;
    if (this.groups != undefined) {
      result = 0;
      this.groups.forEach(element => {
        if (element.Name.toLowerCase().includes(this.Search.toLocaleLowerCase()))
          result++;
      });
    }
    return result;
  }
  private prevSearchRequest: Subscription = null;
  searchForPeople(SearchVal) {
    if (this.prevSearchRequest != null) {
      this.prevSearchRequest.unsubscribe();
    }
    this.searching = true;
    this.prevSearchRequest = this.server.SearchFriend(SearchVal).subscribe((response) => {
      this.searchResult = response.Data as UserPublic[];
      this.searching = false;
    })
  }
  newMessagesTotal(): number {
    let result = 0;
    if (this.groups != undefined)
      this.groups.forEach(element => {
        result += element.NewMessages;
      });
    return result;
  }
  private CheckCode(StatusCode: number) {
    if (StatusCode == 2) {
      this.router.navigate(["login"])
    }
  }
  dateDiff(a: Date, b: Date): number {
    a = new Date(a);
    b = new Date(b);
    return ((b.getTime() - a.getTime()) / 1000);
  }
  getDate(date: Date): string {
    date = new Date(date);
    let result = "";
    let now = new Date(Date.now());
    if (!(now.getDate() == date.getDate() && now.getMonth == date.getMonth && now.getFullYear == date.getFullYear))
      result = date.getDate() + "." + (date.getMonth() + 1).toString() + ". ";
    if (now.getFullYear != date.getFullYear)
      result = date.getFullYear() + " ";
    result += ("0" + date.getHours().toString()).slice(-2) + ":" + ("0" + date.getMinutes().toString()).slice(-2);
    return result;
  }
  handleFileInput(file: FileList) {
    let fileToUpload = file.item(0);
    this.fileService.sendFile(fileToUpload)
  }
}