import streamlit as st
from agent import analyze_clause, generate_dlsa_complaint, get_dlsa_office
from email_service import send_dlsa_email
import json

st.set_page_config(
    page_title="Clause by Clause",
    page_icon="",
    layout="centered"
)

st.markdown("""
<style>
    .main-title {
        font-size: 2.4rem;
        font-weight: 800;
        color: #1B2640;
        margin-bottom: 0;
    }
    .tagline {
        font-size: 1.05rem;
        color: #C8932B;
        font-style: italic;
        margin-bottom: 1.5rem;
    }
    .risk-high {
        background-color: #FFF3F0;
        border-left: 5px solid #B5482A;
        padding: 1rem 1.2rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    .risk-low {
        background-color: #F0FFF4;
        border-left: 5px solid #3E7C5A;
        padding: 1rem 1.2rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    .citation-box {
        background-color: #F4F2EC;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-size: 0.88rem;
        color: #444;
        margin-bottom: 1rem;
    }
    .counter-box {
        background-color: #1B2640;
        color: #FFFFFF;
        padding: 1rem 1.2rem;
        border-radius: 6px;
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 1rem;
    }
    .dlsa-box {
        background-color: #F4F2EC;
        border-left: 5px solid #C8932B;
        padding: 1rem 1.2rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    .email-preview {
        background-color: #FAFAFA;
        border: 1px solid #E0D9C8;
        padding: 1.2rem;
        border-radius: 6px;
        font-family: monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
        margin-bottom: 1rem;
    }
    .confirmation-box {
        background-color: #F0FFF4;
        border-left: 5px solid #3E7C5A;
        padding: 1rem 1.2rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    .disclaimer {
        font-size: 0.78rem;
        color: #999;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #E0D9C8;
    }
    .helpline {
        font-size: 0.9rem;
        color: #C8932B;
        font-weight: 600;
        margin-top: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)


if "screen" not in st.session_state:
    st.session_state.screen = "input"

if "result" not in st.session_state:
    st.session_state.result = {}

if "clause_text" not in st.session_state:
    st.session_state.clause_text = ""

if "doc_type" not in st.session_state:
    st.session_state.doc_type = "rental"

if "district" not in st.session_state:
    st.session_state.district = "Chennai"

if "complaint_data" not in st.session_state:
    st.session_state.complaint_data = {}

if "user_name" not in st.session_state:
    st.session_state.user_name = ""

if "user_email" not in st.session_state:
    st.session_state.user_email = ""


def reset():
    st.session_state.screen = "input"
    st.session_state.result = {}
    st.session_state.clause_text = ""
    st.session_state.complaint_data = {}
    st.session_state.user_name = ""
    st.session_state.user_email = ""
    if "demo_clause" in st.session_state:
        del st.session_state.demo_clause


# ── SCREEN 1: INPUT ──────────────────────────────────────────────
if st.session_state.screen == "input":

    st.markdown(
        '<div class="main-title">Clause by Clause</div>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<div class="tagline">Every signature is a risk nobody explained.</div>',
        unsafe_allow_html=True
    )
    st.write(
        "Paste a clause from your rental agreement or loan note below. "
        "The agent will check it against Tamil Nadu law, explain the risk "
        "in plain language, and help you respond or get free legal help."
    )

    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        doc_type = st.selectbox(
            "Document Type",
            options=["rental", "loan"],
            format_func=lambda x: (
                "Rental Agreement" if x == "rental" else "Loan / Borrowing Note"
            ),
            key="doc_type_select"
        )
    with col2:
        district = st.selectbox(
            "Your District (Tamil Nadu)",
            options=[
                "Chennai", "Coimbatore", "Madurai", "Trichy",
                "Salem", "Tirunelveli", "Erode", "Vellore",
                "Tiruppur", "Thanjavur", "Kancheepuram", "Cuddalore", "Other"
            ],
            key="district_select"
        )

    st.caption(
        "Voice input: On mobile, tap the microphone icon inside "
        "the text area below to speak your clause."
    )

    clause_text = st.text_area(
        "Paste your clause here",
        height=130,
        placeholder=(
            "Example: The tenant shall pay 6 months rent as security deposit. "
            "The deposit will be forfeited if the tenant vacates before completing 12 months."
        ),
        key="clause_input"
    )

    with st.expander("Try a sample clause for demo"):
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("Load Rental Sample", use_container_width=True):
                st.session_state.demo_clause = (
                    "The tenant shall pay 6 months rent as advance security deposit. "
                    "The deposit shall be forfeited entirely if the tenant vacates before "
                    "completing 12 months. The landlord reserves the right to increase rent "
                    "by 20 percent annually without notice or Rent Controller approval."
                )
                st.session_state.demo_doc_type = "rental"
                st.rerun()
        with col_b:
            if st.button("Load Loan Sample", use_container_width=True):
                st.session_state.demo_clause = (
                    "The borrower agrees to pay interest at 36 percent per annum, "
                    "compounded monthly. In case of default exceeding 7 days, the lender "
                    "has the right to seize the borrower's household items and mobile phone "
                    "as collateral without requiring a court order."
                )
                st.session_state.demo_doc_type = "loan"
                st.rerun()

    if "demo_clause" in st.session_state and st.session_state.demo_clause:
        st.info("Sample clause loaded. Click Analyze to proceed.")
        clause_text = st.session_state.demo_clause
        doc_type = st.session_state.get("demo_doc_type", doc_type)

    if st.button("Analyze This Clause", type="primary", use_container_width=True):
        active_clause = clause_text.strip()
        if not active_clause:
            st.warning("Please enter a clause before analyzing.")
        else:
            st.session_state.clause_text = active_clause
            st.session_state.doc_type = doc_type
            st.session_state.district = district

            with st.spinner("Checking against Tamil Nadu law..."):
                result = analyze_clause(active_clause, doc_type, district)

            st.session_state.result = result
            st.session_state.screen = "result"
            if "demo_clause" in st.session_state:
                del st.session_state.demo_clause
            st.rerun()

    st.markdown(
        '<div class="disclaimer">'
        'This tool is not a substitute for legal advice. '
        'For serious or urgent situations, contact your nearest '
        'District Legal Services Authority or call the free Tamil Nadu '
        'legal aid helpline: 15100.'
        '</div>',
        unsafe_allow_html=True
    )


# ── SCREEN 2: RESULT ─────────────────────────────────────────────
elif st.session_state.screen == "result":

    result = st.session_state.result
    doc_type = st.session_state.doc_type
    district = st.session_state.district
    clause_text = st.session_state.clause_text

    st.markdown(
        '<div class="main-title">Clause by Clause</div>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<div class="tagline">Every signature is a risk nobody explained.</div>',
        unsafe_allow_html=True
    )
    st.divider()

    if result.get("error"):
        st.error(f"Something went wrong: {result['error']}")
        if st.button("Try Again"):
            reset()
            st.rerun()

    elif result.get("risk_level") == "HIGH":

        st.markdown(
            '<div class="risk-high">'
            '<strong>High Risk Clause Detected</strong><br>'
            'This clause appears to violate Tamil Nadu law.'
            '</div>',
            unsafe_allow_html=True
        )

        if result.get("plain_explanation"):
            st.subheader("What This Means For You")
            st.write(result["plain_explanation"])

        if result.get("legal_citation"):
            st.markdown(
                f'<div class="citation-box">'
                f'Legal Basis: {result["legal_citation"]}'
                f'</div>',
                unsafe_allow_html=True
            )

        if result.get("legal_limit"):
            st.markdown(
                f'<div class="citation-box">'
                f'What the law allows: {result["legal_limit"]}'
                f'</div>',
                unsafe_allow_html=True
            )

        st.divider()
        st.subheader("What do you want to do?")
        st.write("Choose based on your situation.")

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Option A — Counter-Message**")
            st.caption(
                "Send a polite but firm message to your landlord or lender "
                "disputing this clause."
            )
            if st.button(
                "Send Counter-Message to Other Party",
                use_container_width=True,
                type="primary"
            ):
                st.session_state.screen = "counter"
                st.rerun()

        with col2:
            st.markdown("**Option B — Report to DLSA**")
            st.caption(
                "File a formal complaint with the free legal aid authority "
                "in your district. They will advise or intervene."
            )
            if st.button(
                "Report This to DLSA (Free Legal Aid)",
                use_container_width=True
            ):
                st.session_state.screen = "dlsa_form"
                st.rerun()

    else:
        st.markdown(
            '<div class="risk-low">'
            '<strong>This clause appears standard</strong><br>'
            'No major legal violations were detected in this clause.'
            '</div>',
            unsafe_allow_html=True
        )

        if result.get("plain_explanation"):
            st.subheader("What This Means")
            st.write(result["plain_explanation"])

        if result.get("legal_citation"):
            st.markdown(
                f'<div class="citation-box">'
                f'Reference: {result["legal_citation"]}'
                f'</div>',
                unsafe_allow_html=True
            )

        if result.get("summary"):
            st.write(result["summary"])

        st.info(
            "If something still feels wrong or was not covered, "
            "call the free Tamil Nadu legal aid helpline: 15100"
        )

        if st.button("Analyze Another Clause"):
            reset()
            st.rerun()

    st.markdown(
        '<div class="disclaimer">'
        'This is not legal advice. Clause by Clause helps you understand your rights '
        'and draft communication. For complex or urgent situations, contact your '
        'nearest DLSA or call 15100.'
        '</div>',
        unsafe_allow_html=True
    )


# ── SCREEN 3: COUNTER MESSAGE ─────────────────────────────────────
elif st.session_state.screen == "counter":

    result = st.session_state.result

    st.markdown(
        '<div class="main-title">Clause by Clause</div>',
        unsafe_allow_html=True
    )
    st.divider()

    st.subheader("Counter-Message")
    st.write(
        "The message below has been drafted based on Tamil Nadu law. "
        "You can edit it before sending via WhatsApp, SMS, or in person."
    )

    counter_msg = result.get("counter_message", "")

    edited_message = st.text_area(
        "Your message (editable)",
        value=counter_msg,
        height=200,
        key="counter_edit"
    )

    col1, col2 = st.columns(2)
    with col1:
        st.download_button(
            label="Download as Text File",
            data=edited_message,
            file_name="counter_message.txt",
            mime="text/plain",
            use_container_width=True
        )
    with col2:
        st.code(edited_message, language=None)

    st.divider()
    st.write(
        "If the other party refuses to change this clause after receiving "
        "your message, you can escalate to free legal aid."
    )

    col3, col4 = st.columns(2)
    with col3:
        if st.button("Escalate to DLSA Instead", use_container_width=True):
            st.session_state.screen = "dlsa_form"
            st.rerun()
    with col4:
        if st.button("Analyze Another Clause", use_container_width=True):
            reset()
            st.rerun()

    st.markdown(
        '<div class="helpline">Free Legal Aid Helpline: 15100</div>',
        unsafe_allow_html=True
    )
    st.markdown(
        '<div class="disclaimer">'
        'This is not legal advice. For complex situations, '
        'contact your nearest DLSA.'
        '</div>',
        unsafe_allow_html=True
    )


# ── SCREEN 4: DLSA FORM ───────────────────────────────────────────
elif st.session_state.screen == "dlsa_form":

    district = st.session_state.district
    dlsa = get_dlsa_office(district)

    st.markdown(
        '<div class="main-title">Clause by Clause</div>',
        unsafe_allow_html=True
    )
    st.divider()

    st.subheader("Report to Free Legal Aid (DLSA)")
    st.write(
        f"A formal complaint will be drafted and sent to the "
        f"**{dlsa['office']}** on your behalf."
    )

    st.markdown(
        f'<div class="dlsa-box">'
        f'<strong>{dlsa["office"]}</strong><br>'
        f'Address: {dlsa["address"]}<br>'
        f'Phone: {dlsa["phone"]}'
        f'</div>',
        unsafe_allow_html=True
    )

    user_name = st.text_input(
        "Your Full Name",
        placeholder="Enter your name as it should appear in the complaint",
        key="name_input"
    )

    user_email = st.text_input(
        "Your Email Address",
        placeholder="You will receive a copy of the complaint at this address",
        key="email_input"
    )

    st.caption(
        "Your email is used only to send you a copy of the complaint. "
        "It is not stored or shared."
    )

    col1, col2 = st.columns(2)
    with col1:
        if st.button(
            "Draft the Complaint Email",
            type="primary",
            use_container_width=True
        ):
            if not user_name.strip():
                st.warning("Please enter your name.")
            elif not user_email.strip() or "@" not in user_email:
                st.warning("Please enter a valid email address.")
            else:
                result = st.session_state.result
                with st.spinner("Drafting formal complaint..."):
                    complaint_data = generate_dlsa_complaint(
                        user_name=user_name.strip(),
                        clause_text=st.session_state.clause_text,
                        clause_type=result.get("clause_type", "unknown"),
                        doc_type=st.session_state.doc_type,
                        plain_explanation=result.get("plain_explanation", ""),
                        legal_citation=result.get("legal_citation", ""),
                        district=district
                    )
                st.session_state.complaint_data = complaint_data
                st.session_state.user_name = user_name.strip()
                st.session_state.user_email = user_email.strip()
                st.session_state.screen = "email_preview"
                st.rerun()

    with col2:
        if st.button("Go Back", use_container_width=True):
            st.session_state.screen = "result"
            st.rerun()

    st.markdown(
        '<div class="disclaimer">'
        'This is not legal advice. DLSA provides free legal aid to eligible citizens. '
        'Free helpline: 15100'
        '</div>',
        unsafe_allow_html=True
    )


# ── SCREEN 5: EMAIL PREVIEW ───────────────────────────────────────
elif st.session_state.screen == "email_preview":

    complaint_data = st.session_state.complaint_data
    user_email = st.session_state.user_email
    district = st.session_state.district

    st.markdown(
        '<div class="main-title">Clause by Clause</div>',
        unsafe_allow_html=True
    )
    st.divider()

    st.subheader("Review Your Complaint Email")
    st.write(
        "The email below will be sent to the DLSA office. "
        "You will receive a copy at your email address. "
        "Please read it carefully before sending."
    )

    dlsa_email = complaint_data.get("dlsa_email", "tnsla@tn.gov.in")
    complaint_text = complaint_data.get("complaint_text", "")

    st.markdown(f"**To:** {dlsa_email}")
    st.markdown(f"**CC:** {user_email}")
    st.markdown(
        f"**Subject:** Legal Complaint - Illegal Clause in Agreement - {district}"
    )

    st.markdown(
        f'<div class="email-preview">{complaint_text}</div>',
        unsafe_allow_html=True
    )

    st.divider()

    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("Send This Email", type="primary", use_container_width=True):
            with st.spinner("Sending complaint to DLSA..."):
                send_result = send_dlsa_email(
                    to_address=dlsa_email,
                    user_email=user_email,
                    subject=(
                        f"Legal Complaint - Illegal Clause in Agreement - {district}"
                    ),
                    complaint_text=complaint_text,
                    dlsa_office=complaint_data.get("dlsa_office", "")
                )
            st.session_state.send_result = send_result
            st.session_state.screen = "confirmation"
            st.rerun()

    with col2:
        st.download_button(
            label="Download and Send Yourself",
            data=complaint_text,
            file_name="dlsa_complaint.txt",
            mime="text/plain",
            use_container_width=True
        )

    with col3:
        if st.button("Go Back", use_container_width=True):
            st.session_state.screen = "dlsa_form"
            st.rerun()

    st.markdown(
        '<div class="disclaimer">'
        'Verify DLSA email addresses at tnsla.tn.gov.in if you do not receive '
        'a response within 7 working days. Free helpline: 15100'
        '</div>',
        unsafe_allow_html=True
    )


# ── SCREEN 6: CONFIRMATION ────────────────────────────────────────
elif st.session_state.screen == "confirmation":

    send_result = st.session_state.get("send_result", {})
    complaint_data = st.session_state.complaint_data
    district = st.session_state.district

    st.markdown(
        '<div class="main-title">Clause by Clause</div>',
        unsafe_allow_html=True
    )
    st.divider()

    if send_result.get("success"):
        st.markdown(
            '<div class="confirmation-box">'
            '<strong>Complaint sent successfully.</strong><br>'
            f'Sent to: {send_result.get("sent_to")}<br>'
            f'A copy has been sent to: {send_result.get("cc")}'
            '</div>',
            unsafe_allow_html=True
        )
        st.write(
            "The DLSA office will review your complaint. "
            "Expected response time is 3 to 7 working days."
        )
    else:
        st.error(
            f'The email could not be sent automatically. '
            f'Reason: {send_result.get("error", "Unknown error.")}'
        )
        st.write(
            "Please download the complaint and send it manually to the DLSA office."
        )
        st.download_button(
            label="Download Complaint Letter",
            data=st.session_state.complaint_data.get("complaint_text", ""),
            file_name="dlsa_complaint.txt",
            mime="text/plain"
        )

    st.divider()
    st.subheader("DLSA Office Details")
    st.markdown(
        f'<div class="dlsa-box">'
        f'<strong>{complaint_data.get("dlsa_office")}</strong><br>'
        f'Address: {complaint_data.get("dlsa_address")}<br>'
        f'Phone: {complaint_data.get("dlsa_phone")}<br>'
        f'Email: {complaint_data.get("dlsa_email")}'
        f'</div>',
        unsafe_allow_html=True
    )

    st.markdown(
        '<div class="helpline">'
        'Free Legal Aid Helpline: 15100 (available across Tamil Nadu)'
        '</div>',
        unsafe_allow_html=True
    )
    st.markdown("**Website:** https://tnsla.tn.gov.in")

    st.divider()

    if st.button("Analyze Another Clause", use_container_width=True):
        reset()
        st.rerun()

    st.markdown(
        '<div class="disclaimer">'
        'This tool is not a substitute for legal counsel. '
        'Clause by Clause helps you understand your rights and take the first step. '
        'For urgent situations, call 15100 immediately.'
        '</div>',
        unsafe_allow_html=True
    )