# Admonition Blocks - using html

<p class="admonition info">
Some text with admoniotion block. This texte is long enough to show you that it also works well with carriage return
</p>

<div style="display:grid;grid-template-columns: 1fr 1fr 1fr 1fr ;">
    <div>
        <p class="admonition abstract">abstract</p>
        <p class="admonition tip">tip</p>
        <p class="admonition note">note</p>
        <p class="admonition success">success</p>
    </div>
    <div>
        <p class="admonition question">question</p>
        <p class="admonition warning">warning</p>
        <p class="admonition failure">failure</p>
        <p class="admonition danger">danger</p>
    </div>
    <div>
        <p class="admonition important">important</p>
        <p class="admonition bug">bug</p>
        <p class="admonition example">example</p>
        <p class="admonition quote">quote</p>
    </div>
    <div>
        <p class="admonition custom" data-admonition-icon="🐼 Custom">custom</p>
        <p class="admonition custom" data-admonition-icon="🕶️ Custombis" style="--tc-admonition-bg-color:#d7be00;">custom and custom color</p>
    </div>
</div>

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```html
# Admonition Blocks - using html

<p class="admonition info">
    Some text with admoniotion block. This texte is long enough to show you that
    it also works well with carriage return
</p>

<div>
    <div>
        <p class="admonition abstract">abstract</p>
        <p class="admonition tip">tip</p>
        <p class="admonition note">note</p>
        <p class="admonition success">success</p>
    </div>
    <div>
        <p class="admonition question">question</p>
        <p class="admonition warning">warning</p>
        <p class="admonition failure">failure</p>
        <p class="admonition danger">danger</p>
    </div>
    <div>
        <p class="admonition important">important</p>
        <p class="admonition bug">bug</p>
        <p class="admonition example">example</p>
        <p class="admonition quote">quote</p>
    </div>
    <div>
        <p class="admonition custom" data-admonition-icon="🐼 Custom">custom</p>
        <p
            class="admonition custom"
            data-admonition-icon="🕶️ Custombis"
            style="--tc-admonition-bg-color:#d7be00;">
            custom and custom color
        </p>
    </div>
</div>
```

##==##

# Admonition Blocks - using markdown

Some info block

<!-- .element: class="admonition info" -->

Custom and custom color

<!-- .element: class="admonition custom" data-admonition-icon="🕶️ Custombis" style="--tc-admonition-bg-color:#d7be00;" -->

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
# Admonition Blocks - using markdown

Some info block

<!-- .element: class="admonition info" -->

Custom and custom color

<!-- .element: class="admonition custom" data-admonition-icon="🕶️ Custombis" style="--tc-admonition-bg-color:#d7be00;" -->
```

##==##

# Admonition Blocks - using custom syntax

!!! info
Some info block
!!!

!!! custom tc-admonition-type="🕶️ Custombis" tc-admonition-color="#d7be00"
Custom and custom color
!!!

##--##

<!-- .slide: class="with-code" -->

# Code to produce / Markdown

```markdown
# Admonition Blocks - using custom syntax

!!! info
Some info block
!!!

!!! custom tc-admonition-type="🕶️ Custombis" tc-admonition-color="#d7be00"
Custom and custom color
!!!
```
