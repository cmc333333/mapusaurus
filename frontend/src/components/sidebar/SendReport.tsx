import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";
import { connect } from "react-redux";
import { isEmail } from "validator";

import { createReport } from "../../apis/reports";
import Filters from "../../store/Lar/Filters";
import { sendReport, setReportEmail } from "../../store/Lar/UIOnly";
import State from "../../store/State";
import { xSmallHeading } from "../../theme";
import FormInput, { inputStyle, inputWidth } from "../FormInput";

export function SendReport({
  handleSendClick,
  handleTextChange,
  reportEmail,
  reportSent,
}) {
  let button = <span>You should receive an email shortly!</span>;
  if (!reportSent) {
    const disabled = !isEmail(reportEmail);
    button = (
      <glamorous.Div textAlign="right">
        <input
          disabled={!isEmail(reportEmail)}
          onClick={handleSendClick}
          type="button"
          value="Send Report"
        />
      </glamorous.Div>
    );
  }

  return (
    <div>
      <hr />
      <glamorous.H2 {...xSmallHeading}>Generate Report</glamorous.H2>
      <FormInput name="Email">
        <glamorous.Input
          css={inputStyle}
          onChange={handleTextChange}
          type="email"
          value={reportEmail}
          width={inputWidth}
        />
      </FormInput>
      {button}
    </div>
  );
}

export default connect(
  ({ lar: { filters, uiOnly } }: State) => ({ filters, uiOnly }),
  dispatch => ({ dispatch }),
  ({ filters, uiOnly: { reportEmail, reportSent } }, { dispatch }) => ({
    reportEmail,
    reportSent,
    handleSendClick: () => dispatch(sendReport(filters)),
    handleTextChange: ev => dispatch(setReportEmail(ev.target.value)),
  }),
)(SendReport);
