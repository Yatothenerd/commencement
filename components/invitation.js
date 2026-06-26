const invitationHTML = `
      <!-- Page 1: Formal Invitation -->
      <div class="page-invite">
        <!-- Corner images: drop files into img/ as corner-tl.png and corner-br.png.
             They stay hidden until the files exist. -->
        <img src="img/corner-tl.png" alt="" class="inv-corner inv-corner-tl" onerror="this.style.display='none'" />
        <img src="img/corner-br.png" alt="" class="inv-corner inv-corner-br" onerror="this.style.display='none'" />

        <div class="inv-khmer-strip-left">
          <div class="inv-khmer-strip-inner"></div>
          <div class="inv-khmer-strip-lines-left">
            <span></span>
          </div>

        </div>


        <div class="inv-body">
          <img src="4x/Invitation_plate@4x.png" alt="Invitation" style="width: 200px; margin-bottom: 10px;" />

          <p class="inv-preamble" style="margin-bottom: 50px;">
            Paragon International University has the honor to invite
          </p>

          <div class="blue-orn">— ✦ —</div>

          <h2 class="inv-name" id="invName">Distinguished Guest</h2>
          <h4 class="inv-pos" id="invPos">Guest's Position</h4>
          <p class="inv-company" id="invCompany" style="display:none;">Company</p>

          <div class="blue-orn">— ✦ —</div>

          <p class="inv-body-text">
            to the Commencement Ceremony for the<br>
            Class of 2026 as our esteemed guest on
          </p>
          <p class="inv-datetime">Saturday, 15 August 2026 at 2:30 PM</p>
          <p class="inv-body-text">at Sokha Hotel, Phnom Penh.</p>

          <p class="inv-rsvp" style="margin-bottom: 100px;">
            RSVP at 017 / 015 996 111 by Monday, 10 August 2026<br>
            Dress Code : Formal
          </p>
        </div>

        <div class="inv-khmer-strip-right">
          <div class="inv-khmer-strip-inner"></div>
          <div class="inv-khmer-strip-lines-right">
            <span></span>
          </div>
        </div>

      </div>
`;
