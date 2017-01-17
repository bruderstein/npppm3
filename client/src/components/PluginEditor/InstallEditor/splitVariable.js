
export default function splitVariable(path) {
  let variableName = '$PLUGINDIR$';
  let restPath = path || '';
  [ '$PLUGINDIR$', '$NPPDIR$', '$PLUGINCONFIGDIR$' ].forEach(candidate => {
    if (path.substr(0, candidate.length) === candidate) {
      variableName = candidate;
      restPath = path.substr(candidate.length);
    }
  });

  return [ variableName, restPath ];
}
