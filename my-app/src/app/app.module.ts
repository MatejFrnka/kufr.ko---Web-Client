import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { Server } from './utility/server.service'
import { HttpClientModule } from '@angular/common/http';
import { MessagesComponent } from './app/messages/messages.component';
import { MessageListComponent } from './app/message-list/message-list.component';
import { PeopleComponent } from './app/people/people.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    MessagesComponent,
    MessageListComponent,
    PeopleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [CookieService, Server],
  bootstrap: [AppComponent]
})
export class AppModule { }
