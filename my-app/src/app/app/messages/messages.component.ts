import { Component, OnInit, NgZone, Input } from '@angular/core';
import { Server } from 'src/app/utility/server.service';
import { GroupInfo } from 'src/app/models/group/group-info.model';
import { SinlgeMessage } from 'src/app/models/messages/single-message.model';
import { UserPublic } from 'src/app/models/people/user-public.model';
import { UserInfo } from 'src/app/models/messages/user-info.model';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
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
  //Contorls left panel with people and messages
  public SidePanelNumber: number = 0;

  private groups: GroupInfo[];
  private selectedGroupId: number;


  private friends: UserPublic[];
  private pendingFriends: UserPublic[];
  private searchResult: UserPublic[] = [];
  private searching: boolean = false;

  private messages: { [id: number]: { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[]; } = {};
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
  isFirstOfGroup(indexOfMessage: number, idGroup: number) {
    if (indexOfMessage == 0)
      return false;
    if (this.dateDiff(this.messages[idGroup][indexOfMessage - 1].message.Sent, this.messages[idGroup][indexOfMessage].message.Sent) > 300)
      return true;
    return false;
  }
  isLastOfGroup(indexOfMessage: number, data: { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[]) {
    if (indexOfMessage == data.length - 1)
      return true;
    if (data[indexOfMessage].message.UserInfo.Id != data[indexOfMessage + 1].message.UserInfo.Id)
      return true;
    if (this.dateDiff(data[indexOfMessage].message.Sent, data[indexOfMessage + 1].message.Sent) > 300)
      return true;
    return false;
  }
  private MessageSeen(IdMessage: number) {
    this.server.SetMessageStauts(IdMessage, true);
  }
  private convertToMessageObj(messages: SinlgeMessage[]): { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[] {
    let result: { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[] = [];
    messages.forEach(element => {
      result.push({ message: element, isFirst: false, isLast: false })
    });

    return result;
  }
  private updateMsgObj(result: { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[], idGroup: number): { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[] {
    for (let i = 0; i < result.length; i++) {
      if (i == result.length - 1) {
        result[i].isLast = true
      }
      else if (this.dateDiff(result[i + 1].message.Sent, result[i].message.Sent) > 300) {
        result[i].isLast = true
      }
      else if (result[i+1].message.UserInfo.Id != result[i].message.UserInfo.Id)
        result[i].isLast = true
    }
    for (let i = 1; i < result.length; i++) {
      result[i - 1].isFirst = result[i].isLast
    }
    return result;
  }
  private convertToMessageArray(messages: { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[]): SinlgeMessage[] {
    let result: SinlgeMessage[] = [];
    messages.forEach(element => {
      result.push(element.message);
    });
    return result;
  }
  getNewMessages(group: number): Promise<any> {
    return this.server.GetNewMessages([group], this.messages[group][0].message.Id).then((response) => {
      this.CheckCode(response.StatusCode);
      this.messages[group] = this.joinMessages(this.messages[group], (response.Data as SinlgeMessage[]));
      this.messages[group] = this.updateMsgObj(this.messages[group], group);
      this.MessageSeen(this.messages[group][0].message.Id);
    })
  }
  loadMoreMessages() {
    let selectedGroup = this.selectedGroupId;
    if ((this.loadingMessages[selectedGroup] == undefined || !this.loadingMessages[selectedGroup]) && (this.allMessagesLoaded[selectedGroup] == undefined || !this.allMessagesLoaded)) {
      this.loadingMessages[selectedGroup] = true;
      this.server.GetMessages(selectedGroup, 20, this.messages[selectedGroup][this.messages[selectedGroup].length - 1].message.Id).then(response => {
        this.CheckCode(response.StatusCode);
        this.loadingMessages[selectedGroup] = false;
        this.messages[selectedGroup] = this.convertToMessageObj(this.convertToMessageArray(this.messages[selectedGroup]).concat(response.Data as SinlgeMessage[]));
        this.MessageSeen(this.messages[selectedGroup][0].message.Id);
        if ((response.Data as SinlgeMessage[]).length == 0)
          this.allMessagesLoaded[selectedGroup] = true;
        this.messages[selectedGroup] = this.updateMsgObj(this.messages[selectedGroup], selectedGroup);
      })
    }
  }
  private scrollToBottom: boolean = false;
  loadMessages(idGroup: number): { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[] {
    if (this.messages[idGroup] == undefined) {
      let amount = 50;
      this.loadingMessages[idGroup] = true;
      this.server.GetMessages(idGroup, amount)
        .then((response) => {
          this.scrollToBottom = true
          this.loadingMessages[idGroup] = false;
          if ((response.Data as SinlgeMessage[]).length < amount)
            this.allMessagesLoaded[idGroup] = true;
          this.messages[idGroup] = this.convertToMessageObj(response.Data as SinlgeMessage[]);
          this.MessageSeen(this.messages[idGroup][0].message.Id);
          this.messages[idGroup] = this.updateMsgObj(this.messages[idGroup], idGroup);
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
      this.getNewMessages(group).then(this.pendingMessages[group] = undefined)
    });
  }
  joinMessages(arrayB: { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[], arrayA: SinlgeMessage[]): { message: SinlgeMessage, isLast: boolean, isFirst: boolean }[] {
    arrayB.forEach(element => {
      let alreadyIn: boolean = false;
      arrayA.forEach(item => {
        if (item.Id == element.message.Id)
          alreadyIn = true;
      });
      if (!alreadyIn)
        arrayA.push(element.message)
    });
    return this.convertToMessageObj(arrayA);
  }
  trimStr(str: string, maxLength: number): string {
    if (str != undefined && str.length > maxLength)
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