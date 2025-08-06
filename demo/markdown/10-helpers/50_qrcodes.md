<!-- .slide: class="transition" -->

# QRCodes

##==##

# You can include QR Code to your slides

You can put QR Codes with plain text in it (URL, text, everything that is inline text for this version)

!!! warning
When you use QR Code, please think at the accessibility of the data you expose ! The QR Code should not be the only way to share your information
!!!

The qrcode is inline (it's an img). text to produce :

`![](TEXT_TO_ENCODE 'tc-qrcode somesCssClasses')`

##==##

# Some examples

<div class="flex-row">

![](test 'tc-qrcode h-200') some text

![](test 'tc-qrcode h-200 text-above') some text above

![](test 'tc-qrcode h-200 text-below') some text below

![](test 'tc-qrcode h-200 text-left') some text left

</div>

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
# Some examples

<div class="flex-row">
![](test 'tc-qrcode h-200') some text
![](test 'tc-qrcode h-200 text-above') some text above
![](test 'tc-qrcode h-200 text-below') some text below
![](test 'tc-qrcode h-200 text-left') some text left
</div>
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="tc-multiple-columns" -->

##++##

# Somes meta examples

## VCard

<br><br>

```
BEGIN:VCARD
VERSION:3.0
N:Lastname;Firstname
FN:Firstname Lastname
ORG:CompanyName
TITLE:JobTitle
ADR:;;123 Sesame St;SomeCity;CA;12345;USA
TEL;WORK;VOICE:1234567890
TEL;CELL:Mobile
TEL;FAX:
EMAIL;WORK;INTERNET:foo@email.com
URL:http://website.com
END:VCARD
```

##++##

##++##

![](BEGIN:VCARD VERSION:3.0 N:Lastname;Firstname FN:Firstname Lastname ORG:CompanyName TITLE:JobTitle ADR:;;123 Sesame St;SomeCity;CA;12345;USA TEL;WORK;VOICE:1234567890 TEL;CELL:Mobile TEL;FAX: EMAIL;WORK; INTERNET:foo@email.com URL:http://website.com END:VCARD 'tc-qrcode h-500')

<!-- .element: class="full-center" -->

##++##

##==##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](BEGIN:VCARD VERSION:3.0 N:Lastname;Firstname FN:Firstname Lastname ORG:CompanyName TITLE:JobTitle ADR:;;123 Sesame St;SomeCity;CA;12345;USA TEL;WORK;VOICE:1234567890 TEL;CELL:Mobile TEL;FAX: EMAIL;WORK; INTERNET:foo@email.com URL:http://website.com END:VCARD 'tc-qrcode h-500')
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="tc-multiple-columns" -->

##++##

# Somes meta examples

## V Calendar

<br><br>

```
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Event Title
DTSTART:Start Date and Time
DTEND:End Date and Time
LOCATION:Event Location
DESCRIPTION:Event Description
END:VEVENT
END:VCALENDAR
```

##++##

##++##

![](BEGIN:VCALENDAR VERSION:2.0 BEGIN:VEVENT SUMMARY:Event Title DTSTART:Start Date and Time DTEND:End Date and Time LOCATION:Event Location DESCRIPTION:Event Description END:VEVENT END:VCALENDAR 'tc-qrcode h-500')

<!-- .element: class="full-center" -->

##++##

##==##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](BEGIN:VCALENDAR VERSION:2.0 BEGIN:VEVENT SUMMARY:Event Title DTSTART:Start Date and Time DTEND:End Date and Time LOCATION:Event Location DESCRIPTION:Event Description END:VEVENT END:VCALENDAR 'tc-qrcode h-500')
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="tc-multiple-columns" -->

##++##

# Somes meta examples

## Emails

<br><br>

```
mailto:email_address?subject=email_subject&body=email_body
```

##++##

##++##

![](mailto:email_address?subject=email_subject&body=email_body 'tc-qrcode h-500')

<!-- .element: class="full-center" -->

##++##

##==##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](mailto:email_address?subject=email_subject&body=email_body 'tc-qrcode h-500')
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="tc-multiple-columns" -->

##++##

# Somes meta examples

## Geo Format

<br><br>

```
geo:latitude,longitude,altitude
```

##++##

##++##

![](geo:latitude,longitude,altitude 'tc-qrcode h-500')

<!-- .element: class="full-center" -->

##++##

##==##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](geo:latitude,longitude,altitude 'tc-qrcode h-500')
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="tc-multiple-columns" -->

##++##

# Somes meta examples

## SMS

<br><br>

```
smsto:phone_number:message
```

##++##

##++##

![](smsto:phone_number:message 'tc-qrcode h-500')

<!-- .element: class="full-center" -->

##++##

##==##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](smsto:phone_number:message 'tc-qrcode h-500')
```

<!-- .element: class="big-code" -->

##==##

<!-- .slide: class="tc-multiple-columns" -->

##++##

# Somes meta examples

## WIFI

<br><br>

```
WIFI:T:network_type;S:network_name;P:password;H:hidden;;
```

##++##

##++##

![](WIFI:T:network_type;S:network_name;P:password;H:hidden;; 'tc-qrcode h-500')

<!-- .element: class="full-center" -->

##++##

##==##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
![](WIFI:T:network_type;S:network_name;P:password;H:hidden;; 'tc-qrcode h-500')
```

<!-- .element: class="big-code" -->
