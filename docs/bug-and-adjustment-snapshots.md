# BUG & ADJUSTMENT SNAPSHOTS (06/01/2026)

## OTHERS MAJOR IN APP (MANDATORY)

- [ ] In current state user need to reload the app manualy using reload or force reload to make the user's data appears. Especially the business toolkits data.
- [ ] Some dialogs/toasts remain unstyled. e.g. delete contract dialog/toast. Many dialogs remains
- [ ] Global search is not totally working. The most critical one is unable to search for business toolkits features.
- [ ] Sometimes text fields are not editable, unable to click on the text field to edit.
- [ ] Move Up/Down need to be replaced with drag and drop.
- [ ] No arrow up/down in any currency field text input. Also let user to choose the currency on settings page.
- [ ] Please replace any "-- [text] --" formatted placeholder with a simpler one. Also don't show the placeholder inside the combobox component's list too.
- [ ] Style any calendar picker better. No native windows style within the app.
- [ ] For all buttons should have brand color glow effect on hover. All button should have universal height.
- [ ] Field, Dropdown, Combobox, Daterangepicker, text field, number field, etc should have consistent height.
- [ ] Side panel rearrangement with new categories :
- [ ] Personal persona : Core | Tools | Extra (Media Suite) | (current state, keep it)
- [ ] Business persona : Core | Working (Project Hub, Invoices, Contracts) | Planning (Clients, Business, Pricelist, Deliverables, Templates, Finance) | Extras (Media Suite)

## Settings Page (MANDATORY)

- [ ] Add shortcuts management within settings page.
- [ ] Add an alert to user when leaving settings page if there are unsaved changes.

## Compass Page

- [ ] "Project Hub" button should be replaced with "Back" button.

## Second Brain Page

- [ ] User confused how to use this page. User wants to use it as a knowledge base, can be used to store notes can be related to a project. I see PARA implementation is raw, not really make to work with proper integration.
- [ ] Second Brain is available in both personas.

## Gamification Card

- [ ] Remove the x button on the top right corner. Since the card is closable by clicking outside the card.
- [ ] Pet icon should have no border. Use context7 to get lottie react documentation to make the cosmetic applied properly. e.g the pet's hat is floating instead of on the pet's head. Proper adjustment need to applied to all type of cosmetics.

## Business Toolkits Page

- [ ] Replace any center modals with side panel sized 1/3 of the container width appears like in project hub instead. Dimmed the background when the side panel appears. (Mandatory).
- [ ] Any list item should be clickable. If the list item contains "edit" button, remove the button and make the list item clickable instead. With proper hover/active states.

## Invoices Page

- [ ] Users need ability to archive invoices. Needs an archive icons in the invoice list.
- [ ] Users need ability to unarchive invoices. Needs an unarchive icons in the invoice list.
- [ ] Users need ability to delete/cancel invoices. Need a delete/cancel invoice icons in the invoice list.
- [ ] User needs ability to undo 'Mark as sent' or if this is has loophole, please give recommendation.
- [ ] This filter should appears as dropdown button
- [ ] In invoice edit page, after export the app need to direct the user to open the exported file.
- [ ] Export result doesnt seems valid if user exported a 'draft' status invoice. The app should act properly when user try to export a 'draft' status invoice.
- [ ] Search bar & "New Invoice" button height as same as the dropdown component height for consistency.

## Contract Page

- [ ] Users need ability to archive contracts. Needs an archive icons in the contract list.
- [ ] Users need ability to unarchive contracts. Needs an unarchive icons in the contract list.
- [ ] Users need ability to delete/cancel contracts. Need a delete/cancel contract icons in the contract list.
- [ ] User needs ability to undo 'Mark as sent' or if this is has loophole, please give recommendation.
- [ ] Contract PDF export result are not met my expectation. Contract content is not reflected to what is editable on the each part editor. Literally same issues with invoice PDF export.
- [ ] Search bar & "New Contract" button height as same as the dropdown component height for consistency.

## Pricelist Page

- [ ] Search bar & "Add New" button height as same as the dropdown component height for consistency.
- [ ] i18n leak on "Unit" dropdown on pricelist edit page.
- [ ] Category field should be like multi select property in Notion. Reusable category through the app.

# Deliverables Page

- [ ] (Add issues here)
