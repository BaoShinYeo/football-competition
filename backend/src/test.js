var input =
  "firstTeam 17/05 2\nsecondTeam 07/02 2\nthirdTeam 24/04 1\nfourthTeam 24/01 1";
console.log(input);
input = input.split(`\n`);

for (var [index, element] of input.entries()) {
  input[index] = element.split(` `);
  //   console.log(i);
}
console.log(input);
